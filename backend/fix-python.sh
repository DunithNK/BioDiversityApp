#!/bin/bash

# Quick Fix Script for Python Version Compatibility Issues
# This script will set up the environment with the best available Python version

echo "=========================================="
echo "🔧 Python Version Fix Script"
echo "=========================================="
echo ""

# Check current Python version
CURRENT_PYTHON=$(python3 --version 2>&1 | awk '{print $2}')
echo "Current Python: $CURRENT_PYTHON"
echo ""

# Deactivate any active virtual environment
deactivate 2>/dev/null

# Remove old virtual environment
if [ -d "venv" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf venv
    echo "✅ Old venv removed"
    echo ""
fi

# Try to find best Python version
echo "🔍 Looking for compatible Python version..."
echo ""

PYTHON_CMD=""

# Check for Python 3.11 (best option)
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
    echo "✅ Found Python 3.11 (recommended)"
# Check for Python 3.10
elif command -v python3.10 &> /dev/null; then
    PYTHON_CMD="python3.10"
    echo "✅ Found Python 3.10 (good)"
# Check for Python 3.9
elif command -v python3.9 &> /dev/null; then
    PYTHON_CMD="python3.9"
    echo "✅ Found Python 3.9 (compatible)"
else
    echo "❌ No compatible Python version found (3.9-3.11)"
    echo ""
    echo "📝 Please install Python 3.11:"
    echo "   macOS:    brew install python@3.11"
    echo "   Ubuntu:   sudo apt install python3.11 python3.11-venv"
    echo "   Windows:  Download from python.org"
    echo ""
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo "Using: Python $PYTHON_VERSION"
echo ""

# Create new virtual environment
echo "📦 Creating virtual environment with $PYTHON_CMD..."
$PYTHON_CMD -m venv venv

if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi

echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
echo "This may take 5-10 minutes..."
echo ""

pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Standard installation failed, trying alternative approach..."
    echo ""
    
    # Try installing TensorFlow without specific version
    pip install fastapi==0.115.0 uvicorn[standard]==0.32.0 python-multipart==0.0.12 pydantic==2.9.2
    pip install sqlalchemy==2.0.36 aiosqlite==0.20.0 python-dotenv==1.0.1 requests
    pip install pillow numpy opencv-python scikit-learn
    
    echo ""
    echo "📦 Trying to install TensorFlow..."
    pip install tensorflow
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ TensorFlow installation failed"
        echo ""
        echo "🔧 Manual fix required:"
        echo "   1. Activate venv: source venv/bin/activate"
        echo "   2. Try: pip install tf-nightly"
        echo "   3. Or install Python 3.11: brew install python@3.11"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Python Version: $PYTHON_VERSION"
echo "Virtual Environment: venv/"
echo ""
echo "📝 Next Steps:"
echo "   1. Verify installation:"
echo "      python -c 'import tensorflow; print(tensorflow.__version__)'"
echo ""
echo "   2. Check dataset:"
echo "      python check_dataset.py"
echo ""
echo "   3. Prepare dataset:"
echo "      python prepare_dataset.py"
echo ""
echo "   4. Train model:"
echo "      python train_model.py"
echo ""
echo "   5. Start server:"
echo "      ./start_server.sh"
echo ""
