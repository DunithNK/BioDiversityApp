#!/bin/bash

# Quick Start Script for Wildlife Tracking Backend
# This script automates the setup process

echo "=========================================="
echo "🐆 Wildlife Tracking Backend Setup"
echo "=========================================="
echo ""

# Check Python version
echo "📋 Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

echo "Python $PYTHON_VERSION"

if [ $? -ne 0 ]; then
    echo "❌ Python 3 is not installed. Please install Python 3.9-3.11."
    exit 1
fi

# Check if Python version is compatible with TensorFlow
if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -gt 11 ]; then
    echo ""
    echo "⚠️  WARNING: Python $PYTHON_VERSION detected"
    echo "   TensorFlow officially supports Python 3.9-3.11"
    echo "   You may encounter compatibility issues"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        echo ""
        echo "📝 Recommendation: Install Python 3.11"
        echo "   brew install python@3.11  # macOS"
        echo "   Then use: python3.11 -m venv venv"
        exit 1

# Try to install dependencies
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install dependencies"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. If TensorFlow installation failed, try:"
    echo "      pip install tensorflow  # installs latest compatible version"
    echo ""
    echo "   2. For Python 3.12+, try:"
    echo "      pip install tf-nightly  # experimental TensorFlow build"
    echo ""
    echo "   3. Best option: Use Python 3.11"
    echo "      brew install python@3.11"
    echo "      python3.11 -m venv venv"
    echo "      source venv/bin/activate"
    echo "      pip install -r requirements.txt exist
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo ""
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Check if dataset exists
echo ""
echo "📂 Checking dataset..."
if [ ! -d "detaset/animals/leopard" ]; then
    echo "⚠️  Leopard dataset not found at detaset/animals/leopard"
    echo "   Please ensure your dataset is in the correct location"
else
    echo "✅ Dataset found"
    
    # Check if prepared dataset exists
    if [ ! -d "prepared_dataset" ]; then
        echo ""
        echo "🔄 Preparing dataset..."
        python prepare_dataset.py
        
        if [ $? -ne 0 ]; then
            echo "❌ Dataset preparation failed"
            exit 1
        fi
        echo "✅ Dataset prepared"
    else
        echo "✅ Prepared dataset already exists"
    fi
fi

# Check if model exists
echo ""
echo "🤖 Checking model..."
if [ ! -f "models/leopard_detector.h5" ]; then
    echo "⚠️  Model not found"
    echo ""
    read -p "Do you want to train the model now? This may take 30-60 minutes. (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 Training model..."
        python train_model.py
        
        if [ $? -ne 0 ]; then
            echo "❌ Model training failed"
            exit 1
        fi
        echo "✅ Model trained successfully"
    else
        echo "⏭️  Skipping model training"
        echo "   You can train later with: python train_model.py"
    fi
else
    echo "✅ Model found"
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
fi

# Get local IP address
echo ""
echo "🌐 Your local IP addresses:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   " $2}'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print "   " $2}' | cut -d'/' -f1
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo "   1. Update BACKEND_URL in your React Native app with one of the IPs above"
echo "   2. Start the server with: python main.py"
echo "   3. Or use: uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "📚 Documentation: See README.md for more details"
echo ""
