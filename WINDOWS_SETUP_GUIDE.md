# Windows Setup Guide - BioDiversity ThermalVital Monitor

Complete guide to run this project on a Windows machine from scratch.

## 📋 Prerequisites

### 1. Install Required Software

#### Python 3.10+ (Required for Backend)
1. Download from: https://www.python.org/downloads/
2. ✅ **IMPORTANT:** Check "Add Python to PATH" during installation
3. Verify installation:
   ```cmd
   python --version
   ```
   Should show: `Python 3.10.x` or higher

#### Node.js 18+ (Required for Frontend)
1. Download from: https://nodejs.org/ (LTS version recommended)
2. Install with default options
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### Git (Required to clone the project)
1. Download from: https://git-scm.com/download/win
2. Install with default options
3. Verify:
   ```cmd
   git --version
   ```

#### Visual Studio Code (Optional but Recommended)
- Download from: https://code.visualstudio.com/

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

```cmd
cd C:\Users\YourUsername\Documents
git clone YOUR_REPOSITORY_URL
cd BioDiversityApp
```

### Step 2: Backend Setup (Python/Flask)

#### A. Open Command Prompt as Administrator
- Press `Win + R`
- Type `cmd`
- Press `Ctrl + Shift + Enter` (to run as admin)

#### B. Navigate to Backend Folder
```cmd
cd C:\Users\YourUsername\Documents\BioDiversityApp\backend
```

#### C. Create Python Virtual Environment
```cmd
python -m venv venv
```

#### D. Activate Virtual Environment
```cmd
venv\Scripts\activate
```
You should see `(venv)` at the start of your command line.

#### E. Install Python Dependencies
```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

**This will install:**
- Flask 3.1.3 (Web framework)
- PyTorch 2.10.0 (Deep learning)
- Ultralytics 8.4.19 (YOLOv8)
- OpenCV 4.13.0 (Image processing)
- NumPy, Pillow, Flask-CORS

⏱ **Installation time:** 5-10 minutes depending on internet speed

#### F. Create Environment Configuration
```cmd
copy .env.example .env
notepad .env
```

Edit the `.env` file:
```env
# Flask configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Server configuration
HOST=0.0.0.0
PORT=5001

# Paths
MODEL_PATH=models/thermal_wildlife_detection/weights/best.pt
UPLOAD_FOLDER=uploads
RESULTS_FOLDER=results
```

Save and close.

#### G. Verify Model File Exists
```cmd
dir models\thermal_wildlife_detection\weights\best.pt
```
Should show a file around **5.9 MB**. If missing, the model wasn't included in git.

#### H. Start Backend Server
```cmd
python app.py
```

✅ **Expected Output:**
```
============================================================
ThermalVital Monitor Backend API
============================================================

Loading detection model...
Loaded model from models\thermal_wildlife_detection\weights\best.pt

Starting Flask server...
API will be available at: http://localhost:5001

Available endpoints:
  GET  /health - Health check
  POST /api/analyze - Analyze thermal image
  GET  /api/history - Get analysis history
  GET  /api/history/<id> - Get specific analysis
  GET  /api/stats - Get statistics
  GET  /api/model/info - Get model information
============================================================
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
 * Running on http://192.168.1.XXX:5001
```

🎉 **Backend is now running!** Keep this terminal open.

---

### Step 3: Frontend Setup (React Native/Expo)

#### A. Open NEW Command Prompt (Keep backend running)
- Press `Win + R`
- Type `cmd`
- Press `Enter`

#### B. Navigate to Project Root
```cmd
cd C:\Users\YourUsername\Documents\BioDiversityApp
```

#### C. Install Node Dependencies
```cmd
npm install
```

⏱ **Installation time:** 3-5 minutes

#### D. Configure API URL for Windows

Find your Windows IP address:
```cmd
ipconfig
```

Look for **IPv4 Address** under your active network adapter (e.g., `192.168.1.100`)

Edit `constants/api.ts`:
```cmd
notepad constants\api.ts
```

Update the `BACKEND_URL`:
```typescript
export const API_CONFIG = {
  // For Windows development
  BACKEND_URL: "http://192.168.1.100:5001", // Replace with YOUR IP
  
  // Endpoints
  ENDPOINTS: {
    ANALYZE: "/api/analyze",
    HEALTH: "/health",
    // ... rest of config
  },
};
```

Save and close.

#### E. Start Expo Development Server
```cmd
npx expo start
```

✅ **Expected Output:**
```
Starting Metro Bundler
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

---

## 📱 Running the App

### Option 1: Using Physical Device (Recommended)

#### Android Device:
1. Install **Expo Go** app from Google Play Store
2. **Connect phone and PC to SAME WiFi network**
3. Open Expo Go app
4. Scan the QR code from terminal
5. App will load and connect to backend

#### iOS Device:
1. Install **Expo Go** app from App Store
2. **Connect phone and Mac to SAME WiFi network**
3. Open Camera app
4. Scan the QR code from terminal
5. Tap notification to open in Expo Go

### Option 2: Using Android Emulator (Windows)

1. Install **Android Studio**: https://developer.android.com/studio
2. Open Android Studio → Tools → AVD Manager
3. Create a virtual device (Pixel 5 recommended)
4. Start the emulator
5. In Expo terminal, press `a` to launch on Android

**For emulator:** Update `constants/api.ts`:
```typescript
BACKEND_URL: "http://10.0.2.2:5001", // Special Android emulator address
```

---

## 🧪 Testing the Setup

### Backend Health Check

Open browser or use curl:
```cmd
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-03-03T07:00:00"
}
```

### Model Information Check
```cmd
curl http://localhost:5001/api/model/info
```

Expected response:
```json
{
  "success": true,
  "model_loaded": true,
  "model_path": "models/thermal_wildlife_detection/weights/best.pt",
  "categories": {
    "0": "unknown",
    "1": "human",
    "2": "giraffe",
    "3": "elephant",
    "4": "dog",
    "5": "leopard"
  }
}
```

### Test Image Analysis

If you have a thermal image:
```cmd
curl -X POST http://localhost:5001/api/analyze?bypass=true ^
  -F "image=@C:\path\to\thermal_image.jpg"
```

(Remove `?bypass=true` if model detects leopards properly)

---

## 🔧 Troubleshooting

### Backend Issues

#### "python: command not found"
- Python not in PATH. Reinstall Python and check "Add to PATH"
- Or use full path: `C:\Python310\python.exe`

#### "Port 5001 is in use"
```cmd
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

#### "Module not found" errors
```cmd
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

#### "Model file not found"
- Check if `backend/models/thermal_wildlife_detection/weights/best.pt` exists
- Model is ~5.9MB, should be in git repository
- If missing, you may need to retrain (see MODEL_TRAINING_GUIDE.md)

### Frontend Issues

#### "Metro bundler error"
```cmd
npx expo start --clear
```

#### "Unable to connect to backend"
1. Check backend is running (`http://localhost:5001/health`)
2. Verify IP address in `constants/api.ts` matches your PC's IP
3. Ensure phone and PC are on SAME WiFi network
4. Check Windows Firewall isn't blocking port 5001:
   - Control Panel → Windows Defender Firewall → Allow an app
   - Allow Python through firewall

#### App crashes or white screen
```cmd
# Clear cache and restart
npx expo start --clear
```

### Network Connection Issues

#### Phone can't reach backend
1. **Find your PC's IP:**
   ```cmd
   ipconfig
   ```
   Look for IPv4 Address (e.g., 192.168.1.100)

2. **Test from phone's browser:**
   Navigate to: `http://YOUR_PC_IP:5001/health`
   
3. **Update API config:**
   Edit `constants/api.ts` with correct IP

4. **Disable Windows Firewall temporarily** (for testing):
   ```cmd
   netsh advfirewall set allprofiles state off
   ```
   (Re-enable after testing: `netsh advfirewall set allprofiles state on`)

---

## 📁 Project Structure (Windows Paths)

```
BioDiversityApp\
├── app\                          # React Native screens
│   └── ThermalView\
│       ├── capture.tsx          # Image upload screen
│       ├── analysis.tsx         # Results display
│       └── ...
├── backend\
│   ├── venv\                    # Python virtual environment (excluded from git)
│   ├── models\
│   │   └── thermal_wildlife_detection\
│   │       └── weights\
│   │           └── best.pt      # Trained model (5.9MB, IN GIT)
│   ├── uploads\                 # Runtime uploads (excluded from git)
│   ├── results\                 # Analysis results (excluded from git)
│   ├── app.py                   # Flask API server
│   ├── thermal_analysis.py      # TSI calculation engine
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Configuration (excluded from git)
├── constants\
│   └── api.ts                   # API configuration
├── package.json                 # Node dependencies
└── README.md                    # Project documentation
```

---

## 🎯 Daily Usage (After Initial Setup)

### Starting the Application

1. **Start Backend** (Terminal 1):
   ```cmd
   cd C:\Users\YourUsername\Documents\BioDiversityApp\backend
   venv\Scripts\activate
   python app.py
   ```

2. **Start Frontend** (Terminal 2):
   ```cmd
   cd C:\Users\YourUsername\Documents\BioDiversityApp
   npx expo start
   ```

3. **Open on Device**: Scan QR code with Expo Go

### Stopping the Application

- Press `Ctrl + C` in both terminals
- Or close the terminal windows

---

## 🔐 Windows Firewall Configuration

If the app can't connect to backend, allow Python through firewall:

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Select **Program** → Next
4. Browse to: `C:\Users\YourUsername\Documents\BioDiversityApp\backend\venv\Scripts\python.exe`
5. Select **Allow the connection** → Next
6. Check all profiles (Domain, Private, Public) → Next
7. Name: `BioDiversity Backend Python` → Finish

---

## 📦 What's NOT in Git (Will be Generated)

These folders/files are excluded from git and created at runtime:

- ✅ `backend/venv/` - Created by you (Step 2C)
- ✅ `backend/uploads/` - Created automatically by Flask
- ✅ `backend/results/` - Created automatically by Flask
- ✅ `backend/__pycache__/` - Created by Python
- ✅ `node_modules/` - Created by `npm install`
- ✅ `backend/.env` - You create from `.env.example`

## ✅ What IS in Git (Pre-trained model)

- ✅ `backend/models/thermal_wildlife_detection/weights/best.pt` (5.9MB)
- ✅ All Python source code (.py files)
- ✅ All React Native source code (.tsx files)
- ✅ `requirements.txt` (Python dependencies)
- ✅ `package.json` (Node dependencies)

This means **NO MODEL RETRAINING NEEDED** on Windows! 🎉

---

## 🚨 Important Notes for Windows

1. **Use backslashes (`\`)** for file paths in Windows (not forward slashes `/`)
2. **Administrator privileges** may be needed for some operations
3. **Antivirus software** might block Python/Node - add exceptions if needed
4. **Python version:** 3.10 or higher required (3.14 works perfectly)
5. **Network:** PC and phone MUST be on same WiFi for physical device testing
6. **Firewall:** May need to allow Python and Node through Windows Firewall

---

## 📞 Quick Reference Commands

### Backend
```cmd
# Activate virtual environment
venv\Scripts\activate

# Start server
python app.py

# Check health
curl http://localhost:5001/health

# View logs (keep terminal open to see logs)
```

### Frontend
```cmd
# Install dependencies
npm install

# Start Expo
npx expo start

# Clear cache and restart
npx expo start --clear
```

### Network
```cmd
# Find your IP
ipconfig

# Check if port is in use
netstat -ano | findstr :5001

# Kill process on port
taskkill /PID <PID> /F
```

---

## 🎓 Next Steps

After successful setup:

1. ✅ Test backend health: `http://localhost:5001/health`
2. ✅ Test model info: `http://localhost:5001/api/model/info`
3. ✅ Upload a thermal image through the app
4. ✅ View TSI analysis results

For model retraining (optional): See [MODEL_TRAINING_GUIDE.md](MODEL_TRAINING_GUIDE.md)

---

## 📚 Additional Resources

- **Python Installation:** https://www.python.org/downloads/windows/
- **Node.js for Windows:** https://nodejs.org/en/download/
- **Expo Documentation:** https://docs.expo.dev/
- **Flask Documentation:** https://flask.palletsprojects.com/
- **React Native:** https://reactnative.dev/

---

**Last Updated:** March 3, 2026  
**Tested On:** Windows 10/11  
**Python Version:** 3.10+  
**Node Version:** 18+
