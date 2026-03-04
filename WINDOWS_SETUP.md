# 🪟 BioDiversityApp - Windows Setup Guide

Complete guide for setting up and running the Leopard Tracking & Monitoring Module on Windows from scratch.

---

## ⏱️ Setup Timeline

| Step | Task | Time Required |
|------|------|---------------|
| 1 | Install Prerequisites (Python, Node.js, Git, Android Studio) | 30-45 min |
| 2 | Clone Repository | 2-5 min |
| 3 | Backend Setup (Python venv + dependencies) | 10-15 min |
| 4 | Dataset Preparation (if training model) | 5-10 min |
| 5 | Model Training (if no pre-trained model) | 15-30 min |
| 6 | Frontend Setup (npm install) | 5-10 min |
| 7 | Launch Application | 2-5 min |
| **Total** | **Complete Setup** | **~1.5-2 hours** |

*Note: If you have a pre-trained model file, skip Step 4-5 and reduce total time to ~1 hour.*

---

## 🚀 Quick Start for First-Time Setup

If you're cloning this project for the first time on Windows, follow these steps in order:

1. **[Install Prerequisites](#-prerequisites)** - Python 3.11, Node.js, Git, Android Studio
2. **[Clone Repository](#-initial-project-setup)** - Get the project code
3. **[Backend Setup](#-backend-setup-python-server)** - Python environment & dependencies
4. **[Dataset & Model](#-model-training-optional)** - Prepare data and train AI model
5. **[Frontend Setup](#-frontend-setup-react-native)** - Install Node.js dependencies
6. **[Run Application](#-run-on-android)** - Start server and launch app

---

## � System Requirements

### Minimum Requirements
- **OS:** Windows 10 (64-bit) or Windows 11
- **RAM:** 8GB (16GB recommended for model training)
- **Disk Space:** 10GB free space
- **Processor:** Intel Core i5 or AMD Ryzen 5 (or equivalent)
- **Internet:** Required for initial setup and package downloads

### Recommended for Model Training
- **RAM:** 16GB or more
- **Processor:** Intel Core i7/i9 or AMD Ryzen 7/9
- **GPU:** NVIDIA GPU with CUDA support (optional, speeds up training)
- **SSD:** Solid State Drive for faster data loading

### For Testing
- **Android Emulator:** Requires CPU virtualization enabled in BIOS (Intel VT-x or AMD-V)
- **Physical Device:** Android 8.0+ with USB debugging enabled

---

## �📋 Prerequisites

Install the following software on your Windows PC before starting:

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

## � Initial Project Setup

### Step 1: Clone the Repository

Open Command Prompt or PowerShell and run:

```cmd
cd C:\Users\YourUsername\Desktop
git clone [your-repository-url] BioDiversityApp
cd BioDiversityApp
```


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

⚠️ **IMPORTANT:** If you see an error about missing model file, continue to the next section to train the model first.

**Keep this terminal window open and running!**

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

If `model_loaded: false`, continue to the Model Training section below.

---

## 🤖 Model Training (Required for First-Time Setup)

If this is your first time setting up the project, you need to train the AI model.

### Step 1: Prepare Dataset

You need leopard and non-leopard images for training. Place them in:

```
backend/
├── dataset/
│   ├── leopard/          ← Put leopard images here (.jpg/.png)
│   └── not_leopard/      ← Put non-leopard images here
```

**Recommended:** At least 100-200 images per category.

### Step 2: Organize Dataset

```cmd
cd backend
venv\Scripts\activate
python prepare_dataset.py
```

This creates:
```
backend/prepared_dataset/
├── train/
│   ├── leopard/          ← 70% of images
│   └── not_leopard/
├── val/
│   ├── leopard/          ← 15% of images
│   └── not_leopard/
└── test/
    ├── leopard/          ← 15% of images
    └── not_leopard/
```

### Step 3: Train the Model

```cmd
python train_model.py
```

**Training Progress:**
```
Epoch 1/50
8/8 [==============================] - 5s 549ms/step
Epoch 2/50
8/8 [==============================] - 4s 512ms/step
...
Epoch 50/50
8/8 [==============================] - 4s 523ms/step

✅ Training complete!
✅ Model saved: models/leopard_detector.h5
✅ Validation Accuracy: 96.15%
```

**Time:** Training takes **15-30 minutes** depending on your PC specs and dataset size.

### Step 4: Verify Model File

```cmd
dir models\leopard_detector.h5
```

Should show a file ~20-30MB in size.

### Step 5: Restart Backend

```cmd
python main.py
```

Now the health check should show `model_loaded: true`.

---

## 📝 Alternative: Use Pre-Trained Model

If you have access to a pre-trained `leopard_detector.h5` file:

1. Copy the file to `backend\models\leopard_detector.h5`
2. Verify size is ~20-30MB
3. Start backend: `python main.py`
4. Check health: `curl http://localhost:8000/health`
5. Should show `model_loaded: true`

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

Change from:shehansalitha@shehans-MacBook-Air-3 backend % mai
n.py
zsh: command not found: main.py
shehansalitha@shehans-MacBook-Air-3 backend % 



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

### Issue 1: Model File Missing (First-Time Setup)

**Error:** `Model file not found at: models/leopard_detector.h5`

**Solution:**
This is normal for first-time setup. You need to train the model:
1. Prepare your dataset in `backend/dataset/` folder
2. Run `python prepare_dataset.py`
3. Run `python train_model.py` (takes 15-30 minutes)
4. Restart backend server

### Issue 2: Python Not Found

**Error:** `'python' is not recognized as an internal or external command`

**Solution:**
1. Reinstall Python 3.11
2. ✅ Check "Add Python to PATH" during installation
3. Restart Command Prompt

### Issue 3: Python Version Incompatibility

**Error:** `ERROR: Could not find a version that satisfies the requirement tensorflow`

**Solution:**
```cmd
python --version  # Must show 3.11.x, NOT 3.12+ or 3.9-
```

If wrong version:
1. Uninstall current Python
2. Download Python 3.11 from https://www.python.org/downloads/release/python-3110/
3. Install with "Add to PATH" checked
4. Delete old venv: `rmdir /s venv`
5. Create new venv: `python -m venv venv`
6. Activate and reinstall: `venv\Scripts\activate` then `pip install -r requirements.txt`

### Issue 4: TensorFlow Installation Fails

**Error:** `Could not find a version that satisfies the requirement tensorflow`

**Solution:**
```cmd
python --version  # Must show 3.11.x, NOT 3.12+
pip install tensorflow==2.15.0 --no-cache-dir
```

If still fails on Windows, try:
```cmd
pip install tensorflow-cpu==2.15.0
```

### Issue 5: Dataset Folder Not Found

**Error:** `Dataset folder not found at: dataset/`

**Solution:**
```cmd
cd backend
mkdir dataset
mkdir dataset\leopard
mkdir dataset\not_leopard
```

Then add your training images to these folders.

### Issue 6: Not Enough Training Images

**Error:** `ValueError: Found 0 images belonging to 2 classes`

**Solution:**
You need at least 50-100 images per category (leopard/not_leopard) for model training. Add more images to:
- `backend/dataset/leopard/`
- `backend/dataset/not_leopard/`

### Issue 7: Port 8000 Already in Use

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

### Issue 8: PowerShell Execution Policy Error

**Error:** `cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 9: Android Emulator Won't Connect

**Error:** App shows "Failed to connect to detection server"

**Solution:**
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `model_loaded: true` in health response
3. In emulator, verify `BACKEND_URL = "http://10.0.2.2:8000"` (NOT localhost)
4. Restart emulator
5. Clear app data: Settings → Apps → Expo Go → Clear Data

### Issue 10: Module Not Found Errors

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```cmd
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue 11: npm install Fails

**Error:** `Error: Cannot find module` or network timeout

**Solution:**
```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules if exists
rmdir /s node_modules

# Reinstall
npm install
```

### Issue 12: Firewall Blocking Connection

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

### First-Time Setup (Run Once)

```cmd
# 1. Clone repository
cd C:\Users\YourUsername\Desktop
git clone [your-repo-url] BioDiversityApp
cd BioDiversityApp

# 2. Setup backend
cd backend
mkdir models
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Prepare dataset (if training model)
mkdir dataset\leopard
mkdir dataset\not_leopard
# Add your images, then:
python prepare_dataset.py
python train_model.py

# 4. Start backend
python main.py
# Keep this terminal open

# 5. Setup frontend (open NEW terminal)
cd C:\Users\YourUsername\Desktop\BioDiversityApp
npm install
npm start
# Press 'a' to launch Android
```

### Daily Workflow (After Initial Setup)

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

## 🔄 Updating from Mac or Another Machine

If you have an existing trained model and want to transfer it to Windows:

### Method 1: Git Pull (Recommended)

```cmd
cd BioDiversityApp
git pull origin main

# If package.json changed
npm install

# If requirements.txt changed
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Note:** If you have `leopard_detector.h5` (trained model), add it to `.gitignore` and transfer manually.

### Method 2: Manual Transfer of Trained Model

1. **On Mac:** Copy `backend/models/leopard_detector.h5` (should be ~20-30MB)
2. **Transfer via:**
   - USB drive
   - Cloud storage (Google Drive, OneDrive, Dropbox)
   - Network transfer (scp, shared folder)
3. **On Windows:** Place in `C:\Users\YourUsername\Desktop\BioDiversityApp\backend\models\`
4. **Verify:** 
   ```cmd
   dir backend\models\leopard_detector.h5
   ```
   Should show file size ~20-30MB

5. **Test:**
   ```cmd
   cd backend
   venv\Scripts\activate
   python main.py
   ```
   Then check: `curl http://localhost:8000/health` should show `model_loaded: true`

### Method 3: Complete Project Transfer

If transferring entire project (including trained model):

1. **On Mac:** Compress project folder:
   ```bash
   cd ~/Desktop
   tar -czf BioDiversityApp.tar.gz BioDiversityApp/
   # Or use Finder → Right-click → Compress
   ```

2. **Exclude unnecessary files:**
   - Do NOT include: `node_modules/`, `backend/venv/`, `backend/__pycache__/`
   - DO include: `backend/models/leopard_detector.h5`

3. **Transfer compressed file to Windows**

4. **On Windows:** Extract and setup:
   ```cmd
   # Extract to Desktop
   cd C:\Users\YourUsername\Desktop
   # (Use 7-Zip or built-in extraction)
   
   # Install Python dependencies
   cd BioDiversityApp\backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   
   # Install Node dependencies
   cd ..
   npm install
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

### For First-Time Setup:

- [ ] Python version is 3.11.x (`python --version`)
- [ ] Git is installed (`git --version`)
- [ ] Node.js is installed (`node --version`)
- [ ] Android Studio is installed with emulator
- [ ] Repository cloned successfully
- [ ] `backend/models/` directory exists
- [ ] Virtual environment created (`backend/venv/` exists)
- [ ] Virtual environment is activated (see `(venv)` in prompt)
- [ ] All Python packages installed (`pip list` shows fastapi, tensorflow)
- [ ] Dataset prepared (if training: `backend/prepared_dataset/` exists)
- [ ] Model file exists (`backend/models/leopard_detector.h5` ~20-30MB)
- [ ] Node modules installed (`node_modules/` directory exists)

### For Running Application:

- [ ] Backend is running (`curl http://localhost:8000/health`)
- [ ] Backend health shows `model_loaded: true`
- [ ] Android emulator is fully booted
- [ ] BACKEND_URL is correct for your setup (emulator: `10.0.2.2:8000`, phone: `YOUR_PC_IP:8000`)
- [ ] Windows Firewall allows Python
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

## ✨ Summary: What You've Accomplished

After completing this setup guide, you have:

### Backend (Python)
- ✅ Installed Python 3.11 and created virtual environment
- ✅ Installed TensorFlow, FastAPI, and all dependencies
- ✅ Prepared dataset with train/val/test splits
- ✅ Trained AI model with 96%+ accuracy (MobileNetV2)
- ✅ Running FastAPI server on port 8000
- ✅ SQLite database initialized for alerts and assessments

### Frontend (React Native)
- ✅ Installed Node.js and Expo dependencies
- ✅ Connected to backend via REST API
- ✅ Image capture and upload functionality
- ✅ Health assessment form
- ✅ Results display with severity levels
- ✅ Map visualization with color-coded markers
- ✅ Alert history tracking

### Application Features
- 🐆 **Leopard Detection:** Upload photos → AI identifies leopards with confidence score
- 📍 **Location Tracking:** GPS coordinates for each sighting
- 🏥 **Health Assessment:** 5 health indicators with severity calculation
- 🗺️ **Conditional Mapping:** Map only shows when leopards detected
- 🎨 **Color-Coded Hotspots:** Red (Critical) → Orange (High) → Yellow (Moderate) → Green (Low)
- 📊 **Alert History:** View all past detections with timestamps
- 💾 **Local Database:** SQLite stores all data locally

### Next Steps
1. **Add More Training Data:** Improve model accuracy by adding more diverse images
2. **Test in Field:** Deploy to Gal Oya National Park with physical devices
3. **Backup Database:** Regularly backup `wildlife_tracking.db`
4. **Monitor Performance:** Track detection accuracy and health assessment patterns
5. **Scale Up:** Consider cloud deployment for multi-user access

---

## 📧 Support & Documentation

- **This Guide:** Complete Windows setup instructions
- **README.md:** Project overview and features
- **Code Comments:** Detailed inline documentation in all source files
- **API Endpoints:** See `backend/main.py` for all 8 REST endpoints
- **Model Architecture:** MobileNetV2 transfer learning in `train_model.py`

For technical issues, check the [Common Issues & Solutions](#%EF%B8%8F-common-issues--solutions) section above.

---

**Last Updated:** March 2, 2026  
**Version:** 2.0.0  
**Tested On:** Windows 10/11, Python 3.11, Node.js 18, Android 13+  
**Setup Type:** Complete first-time installation from Git clone

