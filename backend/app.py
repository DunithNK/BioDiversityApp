"""
ThermalVital Monitor Backend API
Flask backend for thermal wildlife health assessment
"""

from flask import Flask, request, jsonify, send_file
import cv2
import numpy as np
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models as tv_models, transforms as tv_transforms
from ultralytics import YOLO
import json
from datetime import datetime
import os
import uuid
from dotenv import load_dotenv

from thermal_analysis import ThermalStressAnalyzer, ThermalAnalysisResult

# Load environment variables
load_dotenv()

app = Flask(__name__)


@app.before_request
def handle_preflight():
    """Intercept ALL OPTIONS preflight requests before Flask routing touches them."""
    if request.method == "OPTIONS":
        response = app.make_response("")
        response.status_code = 200
        response.headers["Access-Control-Allow-Origin"]  = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Max-Age"]       = "3600"
        return response


@app.after_request
def add_cors_headers(response):
    """Stamp CORS headers on every response — including 4xx/5xx errors."""
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

# Configuration
UPLOAD_FOLDER = Path(os.getenv('UPLOAD_FOLDER', 'uploads'))
RESULTS_FOLDER = Path(os.getenv('RESULTS_FOLDER', 'results'))
MODEL_PATH = Path(os.getenv('MODEL_PATH', 'models/thermal_wildlife_detection/weights/best.pt'))

UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)

# Paths & thresholds
CLASSIFIER_PATH      = Path(os.getenv('CLASSIFIER_PATH',      'models/leopard_classifier.pt'))
CLASSIFIER_THRESHOLD = float(os.getenv('CLASSIFIER_THRESHOLD', '0.50'))

# Initialize components
thermal_analyzer = ThermalStressAnalyzer()
detection_model  = None
classifier_model = None   # Binary leopard / not-leopard MobileNetV2 classifier


def load_detection_model():
    """Load YOLO bounding-box model + binary MobileNetV2 leopard classifier."""
    global detection_model, classifier_model
    try:
        # ── YOLO model (for bounding-box extraction only) ──────────────────
        if MODEL_PATH.exists():
            detection_model = YOLO(str(MODEL_PATH))
            print(f"✓ YOLO model loaded from {MODEL_PATH}")
            print(f"  Trained classes: {list(detection_model.names.values())}")
        else:
            print(f"⚠️ YOLO model not found at {MODEL_PATH} — full-frame bbox fallback will be used")
            detection_model = None

        # ── Binary leopard classifier (MobileNetV2) ────────────────────────
        if CLASSIFIER_PATH.exists():
            clf = tv_models.mobilenet_v2(weights=None)
            clf.classifier[1] = nn.Linear(1280, 2)
            clf.load_state_dict(torch.load(str(CLASSIFIER_PATH), map_location='cpu'))
            clf.eval()
            classifier_model = clf
            print(f"✓ Binary leopard classifier loaded from {CLASSIFIER_PATH}")
            print(f"  Classes: leopard(0) | nonleopard(1)   threshold={CLASSIFIER_THRESHOLD}")
        else:
            print(f"⚠️ Classifier not found at {CLASSIFIER_PATH}")
            print(f"   Run:  python train_classifier.py  to train it first.")
            classifier_model = None

    except Exception as e:
        print(f"Error loading models: {e}")
        import traceback; traceback.print_exc()
        detection_model  = None
        classifier_model = None


def is_thermal_image(image):
    """
    Detect if an image is a thermal image based on characteristics:
    - Limited color palette (thermal colormaps)
    - Low color variance
    - Specific color distributions
    """
    try:
        # Convert to HSV to analyze color distribution
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Check 1: Limited unique colors (thermal images have gradients, not many distinct colors)
        unique_colors = len(np.unique(image.reshape(-1, image.shape[2]), axis=0))
        total_pixels = image.shape[0] * image.shape[1]
        color_ratio = unique_colors / total_pixels
        
        # Check 2: Low saturation variance (thermal images are often grayscale or single-hue)
        saturation_std = np.std(hsv[:, :, 1])
        
        # Check 3: Color distribution (thermal images often have bimodal or uniform distributions)
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
        hist_variance = np.var(hist)
        
        # Scoring system
        is_thermal = False
        reasons = []
        
        # Thermal images typically have:
        if color_ratio < 0.1:  # Less than 10% unique colors
            is_thermal = True
            reasons.append(f"Limited color palette ({color_ratio:.1%})")
        
        if saturation_std < 40:  # Low saturation variance
            is_thermal = True
            reasons.append(f"Low saturation variance ({saturation_std:.1f})")
        
        if hist_variance > 100000:  # High histogram variance (bimodal distribution)
            is_thermal = True
            reasons.append(f"Thermal color distribution pattern")
        
        if is_thermal:
            print(f"  🌡️ THERMAL IMAGE DETECTED: {', '.join(reasons)}")
        else:
            print(f"  📷 Regular photo detected (color_ratio={color_ratio:.1%}, sat_std={saturation_std:.1f})")
        
        return is_thermal
        
    except Exception as e:
        print(f"  ⚠️ Thermal detection error: {e}, assuming regular photo")
        return False


# ── Binary leopard classifier ──────────────────────────────────────────────────

_classify_transform = tv_transforms.Compose([
    tv_transforms.Resize((224, 224)),
    tv_transforms.ToTensor(),
    tv_transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def classify_image(image_bgr):
    """
    Run binary MobileNetV2 classifier on a BGR image (OpenCV format).

    Returns:
        (is_leopard: bool, leopard_prob: float)
        - is_leopard  → True  = proceed to thermal analysis
        - is_leopard  → False = reject (not a leopard image)

    Class indices (from train_classifier.py CLASSES list):
        0 = leopard      (ACCEPT)
        1 = nonleopard   (REJECT)
    """
    if classifier_model is None:
        # Classifier not loaded → allow all images through (degrade gracefully)
        print("  ⚠️ Classifier not loaded — allowing image through")
        return True, 1.0

    try:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        pil_img   = Image.fromarray(image_rgb)
        tensor    = _classify_transform(pil_img).unsqueeze(0)

        with torch.no_grad():
            output       = classifier_model(tensor)
            probs        = torch.softmax(output, dim=1)
            leopard_prob = probs[0][0].item()   # index 0 = 'leopard' class

        is_leopard = leopard_prob >= CLASSIFIER_THRESHOLD
        label      = "✅ ACCEPT" if is_leopard else "❌ REJECT"
        print(f"  🔍 Classifier: leopard_prob={leopard_prob:.3f}  →  {label}")
        return is_leopard, leopard_prob

    except Exception as e:
        print(f"  ⚠️ Classifier error: {e} — defaulting to accept")
        return True, 1.0


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detection_model is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_thermal_image():
    """
    Analyze thermal image and compute TSI
    
    Request body:
    {
        "image": "base64_encoded_image" or multipart/form-data
    }
    
    Returns:
    {
        "success": true,
        "analysis": {...},
        "detections": [...],
        "analysis_id": "uuid"
    }
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        # Get image from request
        if 'image' in request.files:
            # Handle multipart/form-data
            file = request.files['image']
            image_data = file.read()
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif 'image' in request.json:
            # Handle base64 encoded image
            image_b64 = request.json['image']
            if ',' in image_b64:
                image_b64 = image_b64.split(',')[1]
            
            image_data = base64.b64decode(image_b64)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image format'}), 400
        
        # Save original image
        analysis_id = str(uuid.uuid4())
        image_path = UPLOAD_FOLDER / f"{analysis_id}.jpg"
        cv2.imwrite(str(image_path), image)
        
        # ── STEP 0: Bypass mode (for testing) ────────────────────────────────
        bypass_detection = request.args.get('bypass', 'false').lower() == 'true'

        # ── STEP 1: Binary classifier — is this a leopard? ───────────────────
        # Trained on NewDetaset/ (leopard/ + nonleopard/)
        # Accepts: thermal OR regular leopard images.
        # Rejects: non-leopard images (other animals, screenshots, etc.)
        is_leopard, leopard_prob = classify_image(image)

        if not is_leopard and not bypass_detection:
            print(f"❌ REJECTED — not-leopard (prob={leopard_prob:.3f})")
            return jsonify({
                'success': False,
                'error': 'No leopard detected in image',
                'message': (
                    f'❌ This does not appear to be a leopard image '
                    f'(leopard confidence: {leopard_prob:.0%}).\n\n'
                    'Please upload a THERMAL image of a leopard for health analysis.'
                ),
                'leopard_probability': round(leopard_prob, 3),
                'detected_animals': 'non-leopard subject',
                'analysis_id': analysis_id,
            }), 400

        # ── STEP 2: Thermal check — is this a thermal image? ──────────────────
        # A regular leopard photo passes the classifier but cannot be thermally
        # analysed (temperature readings would be meaningless on RGB data).
        # Only thermal images should continue to the analysis pipeline.
        is_thermal = is_thermal_image(image)

        if not is_thermal and not bypass_detection:
            print(f"❌ REJECTED — leopard detected (prob={leopard_prob:.3f}) but image is NOT thermal")
            return jsonify({
                'success': False,
                'error': 'Not a thermal image',
                'message': (
                    '❌ This looks like a regular photo of a leopard, not a thermal image.\n\n'
                    'Please upload a THERMAL (infrared) image of a leopard captured '
                    'with a thermal camera (e.g. FLIR ONE) for health analysis.'
                ),
                'leopard_probability': round(leopard_prob, 3),
                'is_thermal': False,
                'analysis_id': analysis_id,
            }), 400

        print(f"✅ ACCEPTED — leopard (prob={leopard_prob:.3f}) + thermal image confirmed")

        # ── STEP 3: YOLO bounding-box extraction ─────────────────────────────
        # Used only for localising the leopard in the frame, NOT for accept/reject.
        detections        = []
        leopard_detection = None

        if detection_model is not None:
            yolo_results = detection_model(image)
            print(f"\n🔍 YOLO Bounding-box Detection (localisation only):")
            for result in yolo_results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf       = box.conf[0].item()
                    cls        = int(box.cls[0].item())
                    class_name = result.names[cls]

                    det = {
                        'bbox':       [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': round(conf, 3),
                        'class_id':   cls,
                        'class_name': class_name,
                        'source':     'yolo_model',
                    }
                    detections.append(det)
                    print(f"  - {class_name} (conf: {conf:.3f})")

                    if class_name.lower() == 'leopard' and (
                        leopard_detection is None or conf > leopard_detection['confidence']
                    ):
                        leopard_detection = det

        # ── STEP 4: Determine analysis bounding-box ──────────────────────────
        if leopard_detection is not None:
            leopard_bbox = tuple(leopard_detection['bbox'])
            print(f"✅ Using YOLO bbox: {leopard_bbox}")
        else:
            h, w = image.shape[:2]
            margin = 0.1
            leopard_bbox = (
                int(w * margin),
                int(h * margin),
                int(w * (1 - margin)),
                int(h * (1 - margin)),
            )
            print(f"✅ ACCEPTED (classifier prob={leopard_prob:.3f}) — using full-frame bbox")
        
        # Perform thermal analysis
        analysis_result = thermal_analyzer.analyze_thermal_image(image, leopard_bbox)
        
        # Generate report dictionary
        report = thermal_analyzer.generate_report_dict(analysis_result)
        report['analysis_id'] = analysis_id
        report['timestamp'] = datetime.now().isoformat()
        report['image_path'] = str(image_path)
        
        # Save analysis result
        result_path = RESULTS_FOLDER / f"{analysis_id}.json"
        with open(result_path, 'w') as f:
            json.dump({
                'report': report,
                'detections': detections
            }, f, indent=2)
        
        # Create annotated image
        annotated_image = image.copy()
        
        # Draw bounding boxes
        for detection in detections:
            bbox = detection['bbox']
            cv2.rectangle(annotated_image, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
            label = f"{detection['class_name']} {detection['confidence']:.2f}"
            cv2.putText(annotated_image, label, (bbox[0], bbox[1] - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Draw anatomical regions
        for region in analysis_result.regions:
            bbox = region.bbox
            cv2.rectangle(annotated_image, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (255, 0, 0), 1)
            cv2.putText(annotated_image, f"{region.name}: {region.mean_temp:.1f}°C", 
                       (bbox[0], bbox[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)
        
        # Add TSI overlay
        status_color = {
            'Normal': (0, 255, 0),
            'Mild Stress': (0, 255, 255),
            'Moderate Stress': (0, 165, 255),
            'Critical Stress': (0, 0, 255)
        }
        color = status_color.get(analysis_result.health_status.value, (255, 255, 255))
        
        cv2.rectangle(annotated_image, (10, 10), (400, 100), (0, 0, 0), -1)
        cv2.putText(annotated_image, f"TSI: {analysis_result.tsi:.4f}", (20, 35), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(annotated_image, f"Status: {analysis_result.health_status.value}", (20, 65), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(annotated_image, f"Confidence: {analysis_result.confidence:.2f}", (20, 90), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Save annotated image
        annotated_path = RESULTS_FOLDER / f"{analysis_id}_annotated.jpg"
        cv2.imwrite(str(annotated_path), annotated_image)
        
        # Encode annotated image to base64
        _, buffer = cv2.imencode('.jpg', annotated_image)
        annotated_b64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'analysis': report,
            'detections': detections,
            'analysis_id': analysis_id,
            'annotated_image': f"data:image/jpeg;base64,{annotated_b64}"
        })
    
    except Exception as e:
        print(f"Error in analysis: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_analysis_history():
    """
    Get history of thermal analyses
    
    Returns:
    {
        "success": true,
        "history": [...]
    }
    """
    try:
        history = []
        
        for result_file in sorted(RESULTS_FOLDER.glob('*.json'), reverse=True):
            with open(result_file, 'r') as f:
                data = json.load(f)
                history.append(data.get('report', {}))
        
        return jsonify({
            'success': True,
            'history': history[:50]  # Return last 50 analyses
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/history/<analysis_id>', methods=['GET'])
def get_analysis_detail(analysis_id):
    """
    Get detailed analysis result by ID
    
    Returns:
    {
        "success": true,
        "analysis": {...}
    }
    """
    try:
        result_path = RESULTS_FOLDER / f"{analysis_id}.json"
        
        if not result_path.exists():
            return jsonify({'success': False, 'error': 'Analysis not found'}), 404
        
        with open(result_path, 'r') as f:
            data = json.load(f)
        
        # Load annotated image
        annotated_path = RESULTS_FOLDER / f"{analysis_id}_annotated.jpg"
        if annotated_path.exists():
            with open(annotated_path, 'rb') as img_file:
                img_data = img_file.read()
                img_b64 = base64.b64encode(img_data).decode('utf-8')
                data['annotated_image'] = f"data:image/jpeg;base64,{img_b64}"
        
        return jsonify({
            'success': True,
            'analysis': data
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_statistics():
    """
    Get overall statistics of analyses
    
    Returns:
    {
        "success": true,
        "stats": {...}
    }
    """
    try:
        total_analyses = 0
        status_counts = {
            'Normal': 0,
            'Mild Stress': 0,
            'Moderate Stress': 0,
            'Critical Stress': 0
        }
        avg_tsi = 0
        
        result_files = list(RESULTS_FOLDER.glob('*.json'))
        total_analyses = len(result_files)
        
        tsi_values = []
        for result_file in result_files:
            with open(result_file, 'r') as f:
                data = json.load(f)
                report = data.get('report', {})
                
                status = report.get('health_status', 'Unknown')
                if status in status_counts:
                    status_counts[status] += 1
                
                tsi = report.get('tsi', 0)
                tsi_values.append(tsi)
        
        if tsi_values:
            avg_tsi = sum(tsi_values) / len(tsi_values)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_analyses': total_analyses,
                'status_distribution': status_counts,
                'average_tsi': round(avg_tsi, 4),
                'release_ready': status_counts['Normal'] + status_counts['Mild Stress']
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/model/info', methods=['GET'])
def get_model_info():
    """Get information about the loaded model"""
    return jsonify({
        'success': True,
        'model_loaded': detection_model is not None,
        'model_path': str(MODEL_PATH) if MODEL_PATH.exists() else None,
        'categories': {
            0: 'unknown',
            1: 'human',
            2: 'giraffe',
            3: 'elephant',
            4: 'dog',
            5: 'leopard'
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("ThermalVital Monitor Backend API")
    print("=" * 60)
    
    # Load detection model
    print("\nLoading detection model...")
    load_detection_model()
    
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    # NOTE: Port 5000 is taken by macOS AirPlay Receiver — use 5001 as default
    port = int(os.getenv('PORT', '5001'))
    debug = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    print("\nStarting Flask server...")
    print(f"API will be available at: http://localhost:{port}")
    print("\nAvailable endpoints:")
    print("  GET  /health - Health check")
    print("  POST /api/analyze - Analyze thermal image")
    print("  GET  /api/history - Get analysis history")
    print("  GET  /api/history/<id> - Get specific analysis")
    print("  GET  /api/stats - Get statistics")
    print("  GET  /api/model/info - Get model information")
    print("=" * 60)
    
    app.run(host=host, port=port, debug=debug)
