# 🪟 BioDiversityApp - Windows Setup Guide

Complete guide for running the Leopard Tracking & Monitoring Module on Windows.

---

## 📋 Prerequisites

Install the following software on your Windows PC:

### Required Software

1. **Node.js (v16 or higher)**
   - Download: https://nodejs.org/
   - Choose LTS version
   - ✅ Check "Add to PATH" during installation

2. **Python 3.11** (⚠️ IMPORTANT: Must be 3.11, NOT 3.12 or higher)
   - Download: https://www.python.org/downloads/release/python-3110/
   - ✅ Check "Add Python to PATH" during installation
   - TensorFlow 2.15+ requires Python ≤ 3.11

3. **Git**
   - Download: https://git-scm.com/download/win
   - Use default settings

4. **Android Studio** (for Android Emulator)
   - Download: https://developer.android.com/studio
   - During setup, install Android SDK and Emulator

---

## 🗂️ Project Transfer

Transfer the complete project from Mac to Windows:

### Method 1: Git Clone (Recommended)
```cmd
cd C:\Users\YourUsername\Desktop
git clone [your-repository-url]
cd BioDiversityApp
```

### Method 2: Manual Copy
Copy the entire `BioDiversityApp` folder to Windows via:
- USB drive
- Cloud storage (Google Drive, OneDrive)
- Network transfer

### ⚠️ Critical Files to Include

Ensure these files are present:
```
BioDiversityApp/
├── backend/
│   ├── models/
│   │   └── leopard_detector.h5    ← 22MB trained model (REQUIRED!)
│   ├── main.py
│   ├── database.py
│   ├── train_model.py
│   ├── requirements.txt
│   └── prepared_dataset/           ← Optional (350 training images)
├── app/
│   └── leoTrack/
│       ├── index.tsx
│       ├── health.tsx
│       ├── result.tsx
│       ├── history.tsx
│       └── map.tsx
├── package.json
├── README.md
└── tsconfig.json
```

**Do NOT copy:**
- `node_modules/` (will be installed fresh)
- `backend/venv/` (will be created fresh)
- `backend/__pycache__/` (Python cache)

---

## 🐍 Backend Setup (Python Server)

### Step 1: Open Command Prompt as Administrator

Press `Win + X` → Select "Command Prompt (Admin)" or "Windows PowerShell (Admin)"

### Step 2: Navigate to Backend Directory

```cmd
cd C:\Users\YourUsername\Desktop\BioDiversityApp\backend
```

### Step 3: Verify Python Version

```cmd
python --version
```

Should show: `Python 3.11.x`

If you see 3.12 or higher, uninstall and install Python 3.11 from the link above.

### Step 4: Create Virtual Environment

```cmd
python -m venv venv
```

### Step 5: Activate Virtual Environment

**For Command Prompt:**
```cmd
venv\Scripts\activate
```

**For PowerShell:**
```powershell
venv\Scripts\Activate.ps1
```

> **Note:** If PowerShell shows execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

You should see `(venv)` at the beginning of your command line.

### Step 6: Install Python Dependencies

```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

This will install:
- TensorFlow 2.15+
- FastAPI 0.115.0
- Uvicorn
- SQLAlchemy 2.0.36
- Pillow
- And other dependencies

**Installation may take 5-10 minutes** for TensorFlow.

### Step 7: Verify Model File

```cmd
dir models\leopard_detector.h5
```

Should show a file ~22MB in size. If missing, copy from Mac.

### Step 8: Start Backend Server

```cmd
python main.py
```

✅ **Success message:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**IMPORTANT:** Keep this terminal window **open** and running!

### Step 9: Test Backend

Open **NEW Command Prompt** and run:

```cmd
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-02T14:30:00.123456",
  "model_loaded": true,
  "database": "connected"
}
```

---

## 📱 Frontend Setup (React Native)

### Step 1: Open NEW Command Prompt

Don't close the backend terminal! Open a second one.

### Step 2: Navigate to Project Root

```cmd
cd C:\Users\YourUsername\Desktop\BioDiversityApp
```

### Step 3: Install Node Dependencies

```cmd
npm install
```

This will install Expo and React Native dependencies (~5 minutes).

### Step 4: Start Expo Development Server

```cmd
npm start
```

✅ **Success:** You'll see QR code and options menu:
```
› Press a │ open Android
› Press w │ open web
› Press r │ reload app
```

---

## 📲 Run on Android

### Option A: Android Emulator (Recommended for Windows)

1. **Open Android Studio**
2. Click **Device Manager** (phone icon on right toolbar)
3. Click **Create Device** (if no devices exist)
   - Choose: Pixel 5 or any phone
   - System Image: API 33 (Android 13) or higher
   - Click **Finish**
4. Click **▶️ Play** button to start emulator
5. Wait for emulator to fully boot (1-2 minutes)
6. In Expo terminal, press **`a`** for Android

The app should install and launch automatically.

### Option B: Physical Android Phone (USB Connection)

1. **Enable Developer Mode on Phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options

2. **Enable USB Debugging:**
   - In Developer Options, enable "USB Debugging"

3. **Connect Phone to PC:**
   - Use USB cable
   - Allow USB debugging when prompted

4. **Verify Connection:**
   ```cmd
   adb devices
   ```
   Should show your device ID.

5. **In Expo terminal, press `a`**

---

## 🌐 Network Configuration

### For Android Emulator (Default - No Changes Needed)

✅ Already configured correctly:
```typescript
const BACKEND_URL = "http://10.0.2.2:8000";
```

`10.0.2.2` is a special address that Android emulator uses to access `localhost` on the Windows host machine.

### For Physical Android Phone (USB)

You need to update the backend URL in all files:

#### Step 1: Find Your Windows PC IP Address

```cmd
ipconfig
```

Look for **IPv4 Address** under your active network adapter (Wi-Fi or Ethernet):
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

#### Step 2: Update Files

Update `BACKEND_URL` in these 5 files:

1. **app/leoTrack/index.tsx** (line 24)
2. **app/leoTrack/health.tsx** (line 14)
3. **app/leoTrack/result.tsx** (line 13)
4. **app/leoTrack/history.tsx** (if exists)
5. **app/leoTrack/map.tsx** (if exists)

Change from:
```typescript
const BACKEND_URL = "http://10.0.2.2:8000";
```

To:
```typescript
const BACKEND_URL = "http://192.168.1.100:8000"; // Replace with YOUR IP
```

#### Step 3: Restart Expo

Press `r` in Expo terminal to reload the app.

---

## ⚠️ Common Issues & Solutions

### Issue 1: Python Not Found

**Error:** `'python' is not recognized as an internal or external command`

**Solution:**
1. Reinstall Python 3.11
2. ✅ Check "Add Python to PATH" during installation
3. Restart Command Prompt

### Issue 2: TensorFlow Installation Fails

**Error:** `Could not find a version that satisfies the requirement tensorflow`

**Solution:**
```cmd
python --version  # Must show 3.11.x, NOT 3.12+
pip install tensorflow==2.15.0 --no-cache-dir
```

### Issue 3: Port 8000 Already in Use

**Error:** `[Errno 10048] Only one usage of each socket address`

**Solution:**
```cmd
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID 12345 /F

# Or change port in backend/main.py (line 357):
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Issue 4: PowerShell Execution Policy Error

**Error:** `cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 5: Android Emulator Won't Connect

**Error:** App shows "Failed to connect to detection server"

**Solution:**
1. Verify backend is running: `curl http://localhost:8000/health`
2. In emulator, check `BACKEND_URL = "http://10.0.2.2:8000"` (NOT localhost)
3. Restart emulator
4. Clear app data: Settings → Apps → Expo Go → Clear Data

### Issue 6: Module Not Found Errors

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```cmd
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue 7: Model File Missing

**Error:** `Model file not found at: models/leopard_detector.h5`

**Solution:**
- Copy `leopard_detector.h5` from Mac to Windows
- Place in `backend/models/` directory
- File should be ~22MB

### Issue 8: Firewall Blocking Connection

**Error:** App can't reach backend on physical phone

**Solution:**
1. Windows Defender Firewall → Allow an app
2. Find Python (python.exe) and check both Private and Public
3. Or temporarily disable firewall for testing

---

## 🧪 Verification & Testing

### 1. Backend Health Check

```cmd
curl http://localhost:8000/health
```

✅ Expected:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "database": "connected"
}
```

### 2. Check All Endpoints

```cmd
# Get alerts
curl http://localhost:8000/alerts

# Root endpoint
curl http://localhost:8000/
```

### 3. Test Image Upload

From Android emulator/phone:
1. Click "Upload Image"
2. Select a leopard photo
3. Should see: "🐆 Leopard Detected! Confidence: 99.X%"

### 4. Complete Flow Test

1. Upload leopard image → AI detection ✅
2. Location captured (7.1, 81.4 on emulator) ✅
3. Click "Continue to Analysis" ✅
4. Toggle health indicators ✅
5. Submit assessment ✅
6. View results with severity level ✅
7. Check history → See your alert ✅
8. View map → See pin on Gal Oya ✅

---

## 📊 Project Structure

```
BioDiversityApp/
├── backend/                         # Python FastAPI server
│   ├── venv/                        # Virtual environment (Windows)
│   ├── models/
│   │   └── leopard_detector.h5      # Trained TensorFlow model (22MB)
│   ├── prepared_dataset/            # Training data (350 images)
│   │   ├── train/
│   │   ├── val/
│   │   └── test/
│   ├── main.py                      # FastAPI server
│   ├── database.py                  # SQLAlchemy models
│   ├── train_model.py               # Model training script
│   ├── requirements.txt             # Python dependencies
│   └── wildlife_tracking.db         # SQLite database
│
├── app/                             # React Native frontend
│   ├── leoTrack/                    # Leopard tracking module
│   │   ├── index.tsx               # Main detection screen
│   │   ├── health.tsx              # Health assessment form
│   │   ├── result.tsx              # Assessment results
│   │   ├── history.tsx             # Alert history
│   │   └── map.tsx                 # Map visualization
│   ├── _layout.tsx
│   └── (tabs)/
│
├── node_modules/                    # Node.js dependencies
├── package.json                     # Node dependencies config
├── tsconfig.json                    # TypeScript config
├── README.md                        # Main documentation
└── WINDOWS_SETUP.md                 # This file
```

---

## 🚀 Quick Start Commands

### Daily Workflow

**Terminal 1 - Backend:**
```cmd
cd C:\Users\YourUsername\Desktop\BioDiversityApp\backend
venv\Scripts\activate
python main.py
```

**Terminal 2 - Frontend:**
```cmd
cd C:\Users\YourUsername\Desktop\BioDiversityApp
npm start
```

Press `a` in Terminal 2 to launch Android.

---

## 🔄 Updating from Mac

When you make changes on Mac and want to sync to Windows:

### Method 1: Git (Recommended)
```cmd
cd BioDiversityApp
git pull origin main
npm install  # If package.json changed
```

### Method 2: Manual Copy
1. Copy changed files from Mac
2. Don't overwrite `venv/` or `node_modules/`
3. If `requirements.txt` changed:
   ```cmd
   cd backend
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

---

## 📝 Configuration Reference

### Backend Configuration

**File:** `backend/main.py`
- **Host:** `0.0.0.0` (listens on all interfaces)
- **Port:** `8000`
- **Model Path:** `models/leopard_detector.h5`
- **Database:** `wildlife_tracking.db` (SQLite)

### Frontend Configuration

**Android Emulator:**
```typescript
const BACKEND_URL = "http://10.0.2.2:8000";
```

**Physical Phone:**
```typescript
const BACKEND_URL = "http://YOUR_PC_IP:8000";
```

Find PC IP: `ipconfig` → IPv4 Address

---

## 📞 Troubleshooting Checklist

Before asking for help, verify:

- [ ] Python version is 3.11.x (`python --version`)
- [ ] Virtual environment is activated (see `(venv)` in prompt)
- [ ] Backend is running (`curl http://localhost:8000/health`)
- [ ] Model file exists at `backend\models\leopard_detector.h5`
- [ ] Android emulator is fully booted
- [ ] BACKEND_URL is correct for your setup
- [ ] Windows Firewall allows Python
- [ ] Node.js is installed (`node --version`)
- [ ] Expo is running (`npm start`)

---

## 🎓 System Architecture

```
┌─────────────────────────────────────────┐
│         Android Device/Emulator         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   React Native App (Expo)         │  │
│  │                                   │  │
│  │  • Image Capture/Upload           │  │
│  │  • Health Assessment Form         │  │
│  │  • Results Display                │  │
│  │  • History & Map                  │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼──────────────────────┘
                   │ HTTP REST API
                   │ (10.0.2.2:8000)
                   ▼
┌─────────────────────────────────────────┐
│         Windows PC (localhost)          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Python FastAPI Backend          │  │
│  │   (Port 8000)                     │  │
│  │                                   │  │
│  │  • Image Upload Endpoint          │  │
│  │  • TensorFlow Model Inference     │  │
│  │  • SQLite Database                │  │
│  │  • Alert Management               │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │   leopard_detector.h5 (22MB)     │  │
│  │   MobileNetV2 Transfer Learning   │  │
│  │   96.15% Validation Accuracy      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📚 Additional Resources

- **Expo Documentation:** https://docs.expo.dev/
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **TensorFlow Guide:** https://www.tensorflow.org/guide
- **React Native Docs:** https://reactnative.dev/docs/getting-started
- **Android Studio Setup:** https://developer.android.com/studio/install

---

## ✅ Success Indicators

Your system is working correctly when:

1. ✅ Backend health check returns `model_loaded: true`
2. ✅ Frontend connects to backend (no red error badges)
3. ✅ Image upload shows confidence percentage (99.X%)
4. ✅ Location captured (even if default 7.1, 81.4)
5. ✅ Health assessment can be submitted
6. ✅ Results show severity level (None/Low/Moderate/High/Critical)
7. ✅ History displays past alerts
8. ✅ Map shows Gal Oya with sighting pins

---

## 🎯 Production Deployment Notes

For deploying to actual field use at Gal Oya National Park:

1. **Real Phone GPS:** On physical devices outdoors, location will use actual GPS coordinates instead of fallback
2. **Offline Mode:** Consider adding offline capability for areas without internet
3. **Data Backup:** Regularly backup `wildlife_tracking.db` file
4. **Model Updates:** Replace `leopard_detector.h5` to update AI model
5. **Cloud Hosting:** Consider hosting backend on Azure/AWS for remote access

---

**Last Updated:** March 2, 2026  
**Version:** 1.0.0  
**Tested On:** Windows 10/11, Python 3.11, Node.js 18, Android 13+
