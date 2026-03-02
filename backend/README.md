# Wildlife Tracking Backend - Leopard Detection & Health Assessment

Backend API for the WildSense Leopard Tracking & Monitoring Module built with FastAPI, TensorFlow, and SQLite.

## ⚠️ Python Version Requirement

**Important:** TensorFlow requires **Python 3.9-3.11**. If you have Python 3.12+, please see troubleshooting below.

## Features

- 🐆 **Leopard Detection**: AI-powered image classification using MobileNetV2
- 📍 **Geospatial Tracking**: GPS-based alert system for leopard sightings
- 🏥 **Health Assessment**: Risk scoring and conservation recommendations
- 📊 **Historical Data**: Alert history with date filtering
- 🗺️ **Map Visualization**: Geofenced mapping for Gal Oya National Park

## Setup Instructions

### 1. Prerequisites

- **Python 3.9-3.11** (required for TensorFlow)
- pip (Python package manager)

**Check your Python version:**
```bash
python3 --version
```

**If you have Python 3.12+:**
```bash
# Option 1: Use the fix script (recommended)
./fix-python.sh

# Option 2: Install Python 3.11
brew install python@3.11  # macOS

# Then create venv with Python 3.11
python3.11 -m venv venv
```

For more details, see [PYTHON_VERSION.md](PYTHON_VERSION.md)

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Prepare Dataset

The dataset should be organized in `backend/detaset/` with the following structure:
```
detaset/
├── animals/
│   ├── leopard/        # Leopard images
│   ├── cheetah/        # Other big cats
│   ├── lion/
│   └── tiger/
```

Run the dataset preparation script:

```bash
python prepare_dataset.py
```

This will create a `prepared_dataset/` folder with train/val/test splits.

### 5. Train the Model

Train the leopard detection model:

```bash
python train_model.py
```

Training will:
- Use transfer learning with MobileNetV2
- Apply data augmentation
- Save the best model to `models/leopard_detector.h5`
- Take approximately 30-60 minutes depending on hardware

Expected output:
- Model file: `models/leopard_detector.h5`
- Training history: `models/training_history.json`
- Test metrics: `models/test_metrics.json`

### 6. Run the Backend Server

Start the FastAPI server:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start at `http://localhost:8000`

### 7. Update Frontend Configuration

Update the `BACKEND_URL` in your React Native app:

```typescript
// In app/leoTrack/index.tsx, health.tsx, result.tsx, history.tsx, map.tsx
const BACKEND_URL = "http://YOUR_IP_ADDRESS:8000";
```

To find your IP address:
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`
- Linux: `ip addr show`

## API Endpoints

### Health Check
```
GET /
GET /health
```

### Leopard Detection
```
POST /predict
Content-Type: multipart/form-data
Body: file (image)

Response:
{
  "result": "Leopard Detected" | "No Leopard Detected",
  "confidence": 0.95,
  "model_loaded": true
}
```

### Alert Management
```
GET /alerts
Response: Array of alert objects

POST /alert
Body: {
  "alert_id": "string",
  "timestamp": "ISO8601 string",
  "latitude": number,
  "longitude": number,
  "source": "Camera" | "Gallery"
}
```

### Health Assessment
```
POST /assessment
Body: {
  "alert_id": "string",
  "severity": "None" | "Low" | "Moderate" | "High" | "Critical",
  "score": number,
  "indicators": {
    "limping": boolean,
    "visible_injury": boolean,
    "abnormal_behavior": boolean,
    "near_human_area": boolean
  }
}

GET /assessment/{alert_id}
Response: Assessment object
```

## Model Architecture

- **Base**: MobileNetV2 (pre-trained on ImageNet)
- **Custom Head**: 
  - GlobalAveragePooling2D
  - Dense(256, relu) + Dropout(0.5)
  - Dense(128, relu) + Dropout(0.3)
  - Dense(1, sigmoid)
- **Input**: 224x224 RGB images
- **Output**: Binary classification (Leopard vs Not Leopard)

## PPython Version Issues

**Error:** `"No matching distribution found for tensorflow"`

**Solution:**
```bash
# Quick fix (automatically finds compatible Python)
./fix-python.sh

# Or install Python 3.11 and recreate venv
brew install python@3.11
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

See [PYTHON_VERSION.md](PYTHON_VERSION.md) for detailed guide.

### roject Structure

```
backend/
├── main.py                 # FastAPI application
├── database.py            # SQLAlchemy models
├── prepare_dataset.py     # Dataset preparation script
├── train_model.py         # Model training script
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── models/               # Trained models directory
│   └── leopard_detector.h5
├── detaset/              # Raw dataset (gitignored)
├── prepared_dataset/     # Processed dataset (gitignored)
└── wildlife_tracking.db  # SQLite database (gitignored)
```

## Troubleshooting

### Model Not Loading
- Ensure `train_model.py` completed successfully
- Check `models/leopard_detector.h5` exists
- Verify TensorFlow installation: `python -c "import tensorflow; print(tensorflow.__version__)"`

### Connection Issues
- Ensure backend server is running
- Check firewall settings
- Verify IP address is correct in frontend
- Both devices must be on the same network

### Database Errors
- Delete `wildlife_tracking.db` and restart server (will recreate)
- Check write permissions in backend directory

### Image Upload Fails
- Check image file size (should be < 10MB)
- Ensure proper image format (JPEG, PNG)
- Verify network connectivity

## Performance Optimization

### For Training
- Use GPU if available (installs CUDA automatically with TensorFlow)
- Adjust batch size based on available RAM
- Reduce image size if memory constrained

### For Production
- Enable model quantization for faster inference
- Use gunicorn with multiple workers
- Implement caching for repeated predictions

## Security Considerations

- Change default CORS settings for production
- Add authentication middleware
- Implement rate limiting
- Use HTTPS in production
- Validate all input data

## Future Enhancements

- [ ] Individual leopard identification using spot patterns
- [ ] Integration with camera trap networks
- [ ] Real-time alerts via push notifications
- [ ] Advanced health metrics (body condition scoring)
- [ ] Multi-species tracking support
- [ ] Cloud storage for images
- [ ] Analytics dashboard

## License

This project is part of the WildSense biodiversity monitoring system.

## Support

For issues or questions, please refer to the main project documentation.
