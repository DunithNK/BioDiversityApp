# Python Version Compatibility Guide

## Recommended Setup

**Best option: Use Python 3.11**

```bash
# Install Python 3.11 (if not already installed)
brew install python@3.11  # macOS
# or download from python.org for other OS

# Create virtual environment with Python 3.11
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Python Version Support

| Python Version | TensorFlow | Status | Recommendation |
|----------------|------------|--------|----------------|
| 3.9 | ✅ Full | Stable | ✅ Recommended |
| 3.10 | ✅ Full | Stable | ✅ Recommended |
| 3.11 | ✅ Full | Stable | ✅ **Best Choice** |
| 3.12 | ⚠️ Partial | Experimental | Use `requirements-py312.txt` |
| 3.13+ | ❌ Limited | Not Supported | Use Python 3.11 |

## For Python 3.12+

If you're using Python 3.12 or newer:

### Option 1: Use Alternative Requirements
```bash
pip install -r requirements-py312.txt
```

### Option 2: Install TensorFlow Manually
```bash
# Install other dependencies first
pip install fastapi uvicorn python-multipart pydantic
pip install pillow numpy opencv-python scikit-learn
pip install sqlalchemy aiosqlite python-dotenv requests

# Try installing latest TensorFlow
pip install tensorflow

# If that fails, try nightly build
pip install tf-nightly
```

### Option 3: Use Python 3.11 (Recommended)

The safest option is to use Python 3.11:

```bash
# 1. Remove existing venv
rm -rf venv

# 2. Create new venv with Python 3.11
python3.11 -m venv venv

# 3. Activate and install
source venv/bin/activate
pip install -r requirements.txt
```

## Installing Python 3.11

### macOS
```bash
brew install python@3.11
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv
```

### Windows
Download from [python.org](https://www.python.org/downloads/)

## Verifying Installation

After setup, verify everything works:

```bash
python --version  # Should show 3.9-3.11
python -c "import tensorflow as tf; print(tf.__version__)"
python -c "import fastapi; print('FastAPI OK')"
```

## Quick Fix Script

If you're having issues, try this:

```bash
#!/bin/bash

# Quick fix for Python version issues
deactivate 2>/dev/null  # Deactivate if already in venv
rm -rf venv             # Remove old venv

# Try Python 3.11 first
if command -v python3.11 &> /dev/null; then
    echo "Using Python 3.11"
    python3.11 -m venv venv
elif command -v python3.10 &> /dev/null; then
    echo "Using Python 3.10"
    python3.10 -m venv venv
elif command -v python3.9 &> /dev/null; then
    echo "Using Python 3.9"
    python3.9 -m venv venv
else
    echo "No compatible Python found. Please install Python 3.11"
    exit 1
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Save as `fix-python.sh`, make executable, and run:
```bash
chmod +x fix-python.sh
./fix-python.sh
```

## Still Having Issues?

If you continue to have problems:

1. **Check your Python version**
   ```bash
   python3 --version
   ```

2. **Try installing without version constraints**
   ```bash
   pip install tensorflow fastapi uvicorn pillow numpy opencv-python
   ```

3. **Use Docker (alternative approach)**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["python", "main.py"]
   ```

## Need Help?

- Check TensorFlow compatibility: https://www.tensorflow.org/install/pip
- Check Python version: `python3 --version`
- Report issues: Include Python version and error messages
