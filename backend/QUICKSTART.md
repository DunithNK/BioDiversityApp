# 🐆 Leopard Tracking Backend - Quick Start Guide

Complete guide to set up, train, and run the Wildlife Tracking backend.

---

## ⚠️ IMPORTANT: Python Version Compatibility

**TensorFlow requires Python 3.9-3.11**

If you see an error like `"No matching distribution found for tensorflow"`, your Python version is too new.

### Quick Fix (Recommended)

```bash
cd backend
./fix-python.sh
```

This script will automatically find and use a compatible Python version.

### Alternative: Install Python 3.11

```bash
# macOS
brew install python@3.11

# Create venv with Python 3.11
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

For more details, see [PYTHON_VERSION.md](PYTHON_VERSION.md)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Setup (Automated)](#quick-setup-automated)
3. [Manual Setup](#manual-setup)
4. [Training the Model](#training-the-model)
5. [Running the Server](#running-the-server)
6. [Testing](#testing)
7. [Connecting to Frontend](#connecting-to-frontend)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Python**: 3.9 or higher
- **RAM**: Minimum 8GB (16GB recommended for training)
- **Storage**: ~2GB for dataset and models
- **OS**: macOS, Linux, or Windows

Check Python version:
```bash
python3 --version
```

---

## Quick Setup (Automated)

The fastest way to get started:

```bash
cd backend
./setup.sh
```

This script will:
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Prepare the dataset
- ✅ Optionally train the model

Then start the server:
```bash
./start_server.sh
```

---

## Manual Setup

### Step 1: Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows
```

### Step 2: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Expected installation time: 5-10 minutes

### Step 3: Check Dataset

```bash
python check_dataset.py
```

Expected output:
```
🐾 LEOPARD
   Total files: 180+
   Valid images: 180+

🐾 CHEETAH, LION, TIGER
   Similar counts...

📊 Total valid images: 700+
```

### Step 4: Prepare Dataset

```bash
python prepare_dataset.py
```

This creates:
```
prepared_dataset/
├── train/
│   ├── leopard/
│   └── not_leopard/
├── val/
│   ├── leopard/
│   └── not_leopard/
└── test/
    ├── leopard/
    └── not_leopard/
```

---

## Training the Model

### Start Training

```bash
python train_model.py
```

### What Happens

1. **Initial Training** (~20-30 minutes)
   - Uses MobileNetV2 with frozen layers
   - Applies data augmentation
   - Early stopping with validation monitoring

2. **Fine-Tuning** (~10-15 minutes)
   - Unfreezes last 20 layers
   - Lower learning rate
   - Further optimization

### Expected Results

```
🎯 Test Results:
   Accuracy:  0.95+
   Precision: 0.93+
   Recall:    0.94+
   AUC:       0.97+
```

### Output Files

- `models/leopard_detector.h5` - Trained model (50-70 MB)
- `models/training_history.json` - Training logs
- `models/test_metrics.json` - Evaluation results

---

## Running the Server

### Method 1: Using Script

```bash
./start_server.sh
```

### Method 2: Direct Python

```bash
python main.py
```

### Method 3: Uvicorn with Hot Reload

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Verify Server is Running

Visit in browser:
- `http://localhost:8000` - API info
- `http://localhost:8000/health` - Health check
- `http://localhost:8000/docs` - Interactive API docs (Swagger UI)

---

## Testing

### Run Test Suite

```bash
python test_backend.py
```

### Manual API Testing

#### 1. Health Check
```bash
curl http://localhost:8000/health
```

#### 2. Test Prediction
```bash
curl -X POST \
  http://localhost:8000/predict \
  -F "file=@/path/to/leopard_image.jpg"
```

Expected response:
```json
{
  "result": "Leopard Detected",
  "confidence": 0.95,
  "model_loaded": true
}
```

#### 3. Create Alert
```bash
curl -X POST \
  http://localhost:8000/alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": "test-001",
    "timestamp": "2024-03-02T10:00:00Z",
    "latitude": 7.1,
    "longitude": 81.4,
    "source": "Camera"
  }'
```

#### 4. Get Alerts
```bash
curl http://localhost:8000/alerts
```

---

## Connecting to Frontend

### 1. Find Your IP Address

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
```

Example output: `192.168.1.100`

### 2. Update React Native App

Edit these files in your React Native project:

- `app/leoTrack/index.tsx`
- `app/leoTrack/health.tsx`
- `app/leoTrack/result.tsx`
- `app/leoTrack/history.tsx`
- `app/leoTrack/map.tsx`

Change:
```typescript
const BACKEND_URL = "http://172.20.10.2:8000";
```

To:
```typescript
const BACKEND_URL = "http://YOUR_IP_ADDRESS:8000";
```

### 3. Test Connection

From your mobile device or emulator:
```
http://YOUR_IP_ADDRESS:8000/health
```

---

## Troubleshooting

### Issue: Model Not Loading

**Symptom:** Error on startup: "Model not found"

**Solution:**
```bash
# Check if model exists
ls -lh models/leopard_detector.h5

# If not, train the model
python train_model.py
```

---

### Issue: Import Error - TensorFlow

**Symptom:** `ModuleNotFoundError: No module named 'tensorflow'`

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall TensorFlow
pip install tensorflow==2.18.0
```

---

### Issue: Cannot Connect from Phone

**Symptom:** Network error in React Native app

**Solutions:**

1. **Check Same Network**
   - Both phone and computer must be on same WiFi

2. **Check Firewall**
   ```bash
   # macOS - Allow port 8000
   # System Preferences > Security > Firewall > Options
   ```

3. **Verify Server Running**
   ```bash
   curl http://localhost:8000/health
   ```

4. **Test IP from Phone Browser**
   - Open `http://YOUR_IP:8000/health` in phone browser first

---

### Issue: Database Errors

**Symptom:** SQLite errors on startup

**Solution:**
```bash
# Delete and recreate database
rm wildlife_tracking.db
python main.py
```

---

### Issue: Out of Memory During Training

**Symptom:** Training crashes with memory error

**Solutions:**

1. **Reduce Batch Size**
   Edit `train_model.py`:
   ```python
   BATCH_SIZE = 16  # or even 8
   ```

2. **Reduce Image Size**
   ```python
   IMG_SIZE = 128  # instead of 224
   ```

3. **Close Other Applications**

---

### Issue: Poor Detection Accuracy

**Symptom:** Model not detecting leopards correctly

**Solutions:**

1. **Check Dataset Balance**
   ```bash
   python check_dataset.py
   ```

2. **Retrain with More Epochs**
   Edit `train_model.py`:
   ```python
   EPOCHS = 100
   ```

3. **Verify Test Images**
   - Ensure test images are clear
   - Leopard should be visible in image

---

## Performance Tips

### For Faster Training

1. **Use GPU**
   - TensorFlow will automatically use GPU if available
   - Speeds up training 5-10x

2. **Increase Batch Size** (if RAM allows)
   ```python
   BATCH_SIZE = 64
   ```

3. **Reduce Epochs**
   ```python
   EPOCHS = 30
   ```

### For Production

1. **Use Gunicorn** (multiple workers)
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Enable HTTPS**
   ```bash
   uvicorn main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
   ```

3. **Add Caching**
   - Implement Redis for frequently accessed data

---

## Next Steps

✅ **Backend is running!**

Now you can:
1. Open your React Native app
2. Take/upload leopard photos
3. View real-time detections
4. Track alerts on map
5. View assessment history

---

## Support

For detailed API documentation, visit:
`http://localhost:8000/docs`

For issues or questions, refer to:
- `README.md` - Full documentation
- `main.py` - API implementation
- `train_model.py` - Model architecture

---

## Summary of Commands

```bash
# Setup
./setup.sh

# Train model
python train_model.py

# Start server
./start_server.sh

# Test backend
python test_backend.py

# Check dataset
python check_dataset.py
```

---

**Happy Wildlife Tracking! 🐆🌿**
