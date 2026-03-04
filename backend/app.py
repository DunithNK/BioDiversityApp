"""
ThermalVital Monitor Backend API
Flask backend for thermal wildlife health assessment
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image
import torch
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
CORS(app)  # Enable CORS for React Native frontend

# Configuration
UPLOAD_FOLDER = Path(os.getenv('UPLOAD_FOLDER', 'uploads'))
RESULTS_FOLDER = Path(os.getenv('RESULTS_FOLDER', 'results'))
MODEL_PATH = Path(os.getenv('MODEL_PATH', 'models/thermal_wildlife_detection/weights/best.pt'))

UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)

# Initialize components
thermal_analyzer = ThermalStressAnalyzer()
detection_model = None
fallback_model = None  # Pre-trained COCO model for safety check


def load_detection_model():
    """Load YOLO detection model and fallback model"""
    global detection_model, fallback_model
    try:
        if MODEL_PATH.exists():
            detection_model = YOLO(str(MODEL_PATH))
            print(f"✓ Leopard detection model loaded from {MODEL_PATH}")
            print(f"  Trained classes: {list(detection_model.names.values())}")
        else:
            print(f"⚠️ Custom model not found at {MODEL_PATH}")
            detection_model = None
        
        # Always load COCO fallback model for detecting non-trained animals
        try:
            fallback_model = YOLO('yolov8n.pt')  # 80 classes including many animals
            print(f"✓ COCO fallback model loaded (for detecting non-leopard subjects)")
            print(f"  Can detect 80 classes: person, dog, cat, horse, cow, elephant, bear, zebra, giraffe, etc.")
        except Exception as e:
            print(f"⚠️ Fallback model failed to load: {e}")
            fallback_model = None
            
    except Exception as e:
        print(f"Error loading models: {e}")
        detection_model = None
        fallback_model = None


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


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detection_model is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/analyze', methods=['POST'])
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
        
        # Check for bypass mode (for testing with poorly trained models)
        bypass_detection = request.args.get('bypass', 'false').lower() == 'true'
        
        # Check if this is a thermal image
        is_thermal = is_thermal_image(image)
        
        # Detect animals in the image
        detections = []
        leopard_detection = None
        other_animal_detections = []
        
        # STEP 1: Run specialized leopard detection model
        if detection_model is not None:
            results = detection_model(image)
            print(f"\n🔍 Leopard Model Detection Results:")
            for result in results:
                boxes = result.boxes
                print(f"  - Found {len(boxes)} detections")
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = box.conf[0].item()
                    cls = int(box.cls[0].item())
                    class_name = result.names[cls]
                    
                    detection = {
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': round(conf, 3),
                        'class_id': cls,
                        'class_name': class_name,
                        'source': 'custom_model'
                    }
                    detections.append(detection)
                    print(f"  - {class_name} (conf: {conf:.3f}, class_id: {cls})")
                    
                    # Check if this is a leopard detection (any confidence)
                    if class_name.lower() == 'leopard':
                        if leopard_detection is None or conf > leopard_detection['confidence']:
                            leopard_detection = detection
                            print(f"  ✅ Leopard detected (conf: {conf:.3f})")
                    # Track OTHER animals (lion, tiger, cheetah) with reasonable confidence
                    elif conf >= 0.3:  # Lower threshold since it's our trained model
                        other_animal_detections.append(detection)
                        print(f"  ⚠️ Other big cat detected: {class_name} (conf: {conf:.3f})")
        
        # STEP 2: If no leopard found, run fallback COCO model to detect non-leopard subjects
        # For thermal images, use lower confidence threshold since pattern matching is harder
        if leopard_detection is None and fallback_model is not None:
            print(f"\n🔍 Running COCO Fallback Model (checking for non-leopard subjects)...")
            fallback_results = fallback_model(image)
            
            # Adjust confidence threshold based on image type
            confidence_threshold = 0.3 if is_thermal else 0.4
            print(f"  Using confidence threshold: {confidence_threshold} ({'thermal' if is_thermal else 'regular'} image)")
            
            # COCO classes that should trigger rejection (non-leopard subjects)
            reject_classes = [
                'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
                'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'
            ]
            
            for result in fallback_results:
                boxes = result.boxes
                if len(boxes) > 0:
                    print(f"  - Fallback model found {len(boxes)} detections")
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = box.conf[0].item()
                    cls = int(box.cls[0].item())
                    class_name = result.names[cls]
                    
                    # Only track reject-worthy classes with adjusted confidence
                    if class_name.lower() in reject_classes and conf >= confidence_threshold:
                        detection = {
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'confidence': round(conf, 3),
                            'class_id': cls,
                            'class_name': class_name,
                            'source': 'coco_fallback'
                        }
                        other_animal_detections.append(detection)
                        detections.append(detection)
                        print(f"  ⚠️ Non-leopard subject detected: {class_name} (conf: {conf:.3f})")
        
        # REJECTION LOGIC: Only reject if we clearly detect non-leopard subjects AND no leopard
        if len(other_animal_detections) > 0 and leopard_detection is None and not bypass_detection:
            # Sort by confidence and get the most confident detection
            most_confident = max(other_animal_detections, key=lambda x: x['confidence'])
            animal_name = most_confident['class_name']
            animal_conf = most_confident['confidence']
            
            print(f"❌ REJECTED - Non-leopard subject detected: {animal_name} ({animal_conf:.1%}), no leopard found")
            
            animal_list = ', '.join([f"{d['class_name']} ({d['confidence']:.0%})" for d in other_animal_detections])
            
            return jsonify({
                'success': False,
                'error': 'No leopard detected in image',
                'message': f'❌ This image contains: {animal_list}\n\nPlease upload a thermal image of a LEOPARD for health analysis.',
                'detections': detections,
                'detected_animals': animal_list,
                'analysis_id': analysis_id,
            }), 400
        
        # ACCEPTANCE LOGIC: Allow if leopard detected OR no non-leopard subjects detected
        if leopard_detection is not None:
            leopard_bbox = tuple(leopard_detection['bbox'])
            print(f"✅ ACCEPTED - Leopard detected at bbox: {leopard_bbox}")
        else:
            # No animals detected or only low-confidence detections
            # Assume the thermal image is valid and analyze full frame
            h, w = image.shape[:2]
            margin = 0.1
            leopard_bbox = (
                int(w * margin),
                int(h * margin),
                int(w * (1 - margin)),
                int(h * (1 - margin))
            )
            print(f"✅ ACCEPTED - No clear non-leopard detections, analyzing full thermal image (assumed leopard)")
        
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
    port = int(os.getenv('PORT', '5000'))
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
