# ThermalVital Monitor Backend

Backend API for the ThermalVital Monitor component - a thermal-imaging-based framework for assessing the physiological condition and release readiness of leopards in wildlife rehabilitation contexts.

## Features

- **Thermal Image Analysis**: Compute Thermal Stress Index (TSI) from thermal camera imagery
- **Wildlife Detection**: YOLOv8-based detection of animals in thermal images
- **Health Assessment**: Automated health status classification (Normal, Mild/Moderate/Critical Stress)
- **Anatomical Region Analysis**: Multi-regional thermal profiling
- **Bilateral Asymmetry Detection**: Detect thermal imbalances indicating pathology
- **REST API**: Full-featured API for mobile/frontend integration
- **Analysis History**: Store and retrieve past thermal assessments

## Project Structure

```
backend/
├── app.py                      # Main Flask API server
├── thermal_analysis.py         # TSI calculation and thermal analysis logic
├── train_thermal_model.py      # Model training script
├── requirements.txt            # Python dependencies
├── termalDetaset/             # Training dataset
│   └── wildlife termal detaset/
│       ├── Images/
│       └── Annotations/
├── uploads/                    # Uploaded thermal images
├── results/                    # Analysis results and annotated images
└── models/                     # Trained model weights
```

## Installation

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download/Train Model

#### Option A: Train Your Own Model

```bash
python train_thermal_model.py
```

This will:
- Convert the COCO format dataset to YOLO format
- Train a YOLOv8 model on thermal wildlife images
- Save the trained model to `models/thermal_wildlife_detection/weights/best.pt`

Training takes approximately 2-4 hours depending on your hardware (GPU recommended).

#### Option B: Use Pre-trained Model

If you have a pre-trained model, place it at:
```
backend/models/thermal_wildlife_detection/weights/best.pt
```

## Running the Backend

### Development Mode

```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and model information.

### Analyze Thermal Image
```
POST /api/analyze
Content-Type: multipart/form-data or application/json

Body (multipart):
{
  "image": <file>
}

Body (JSON):
{
  "image": "data:image/jpeg;base64,..."
}
```
Returns thermal analysis including TSI, health status, and recommendations.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "tsi": 0.0823,
    "health_status": "Mild Stress",
    "leopard_mean_temp": 36.5,
    "background_mean_temp": 33.7,
    "regions": [...],
    "bilateral_asymmetry": {...},
    "anomalies": [...],
    "recommendations": [...],
    "confidence": 0.87,
    "release_recommended": true
  },
  "detections": [...],
  "analysis_id": "uuid",
  "annotated_image": "data:image/jpeg;base64,..."
}
```

### Get Analysis History
```
GET /api/history
```
Returns list of past analyses (last 50).

### Get Specific Analysis
```
GET /api/history/<analysis_id>
```
Returns detailed information about a specific analysis.

### Get Statistics
```
GET /api/stats
```
Returns overall statistics of all analyses.

### Get Model Information
```
GET /api/model/info
```
Returns information about the loaded detection model.

## Thermal Stress Index (TSI)

The TSI is calculated using:

```
TSI = (T_leopard - T_background) / T_background
```

Where:
- `T_leopard`: Average body temperature from thermal ROI
- `T_background`: Average environmental temperature

### Health Classification

| TSI Range | Health Status | Recommendation |
|-----------|---------------|----------------|
| < 0.05 | Normal | Suitable for release |
| 0.05 - 0.10 | Mild Stress | Monitor 24-48h |
| 0.10 - 0.15 | Moderate Stress | Delay release 3-7 days |
| ≥ 0.15 | Critical Stress | Do not release |

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
FLASK_ENV=development
MODEL_PATH=models/thermal_wildlife_detection/weights/best.pt
UPLOAD_FOLDER=uploads
RESULTS_FOLDER=results
```

### Thermal Parameters

Edit `thermal_analysis.py` to adjust:
- Normal temperature ranges for anatomical regions
- Bilateral asymmetry threshold
- TSI classification thresholds

## Testing

### Test with Sample Image

```bash
curl -X POST http://localhost:5000/api/analyze \
  -F "image=@path/to/thermal/image.jpg"
```

### Test with Base64

```python
import requests
import base64

with open('thermal_image.jpg', 'rb') as f:
    img_data = base64.b64encode(f.read()).decode()

response = requests.post('http://localhost:5000/api/analyze', 
                        json={'image': f'data:image/jpeg;base64,{img_data}'})
print(response.json())
```

## Model Training Details

### Dataset Format
The training script expects COCO format annotations:
- Images: `termalDetaset/wildlife termal detaset/Images/`
- Annotations: `termalDetaset/wildlife termal detaset/Annotations/coco_info.json`

### Training Configuration
- Model: YOLOv8 (nano variant for speed)
- Image size: 640x640
- Batch size: 16
- Epochs: 100
- Data split: 80% train, 20% validation

### GPU Support
The training script automatically uses GPU if available:
```python
device = 'cuda' if torch.cuda.is_available() else 'cpu'
```

## Troubleshooting

### Model Not Loading
- Ensure the model path is correct
- Check that the model file exists
- The API will fall back to a pre-trained YOLOv8 if custom model not found

### Low Confidence Scores
- Ensure thermal images are high quality
- Check that the subject occupies sufficient image area
- Verify proper thermal camera calibration

### Memory Issues
- Reduce batch size in training script
- Use smaller YOLOv8 variant (nano instead of small/medium)
- Process images in smaller batches

## Integration with Frontend

### React Native Example

```typescript
const analyzeThermalImage = async (imageUri: string) => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'thermal.jpg',
  });

  const response = await fetch('http://localhost:5000/api/analyze', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  return result;
};
```

## Contributing

1. Follow PEP 8 style guide for Python code
2. Add type hints where applicable
3. Update tests for new features
4. Document API changes in this README

## License

[Your License Here]

## Citation

If you use this component in research, please cite:

```
ThermalVital Monitor: A Thermal-Imaging-Based Framework for 
Post-Release Animal Health Assessment
[Your Team Name/ID], 2024
```

## Contact

For questions or support, contact: [Your Contact Information]
