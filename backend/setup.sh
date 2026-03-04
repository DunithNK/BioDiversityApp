#!/bin/bash

echo "=========================================="
echo "ThermalVital Monitor Backend Setup"
echo "=========================================="
echo ""

# Check Python version
echo "[1/6] Checking Python version..."
python3 --version

if [ $? -ne 0 ]; then
    echo "Error: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment
echo ""
echo "[2/6] Creating virtual environment..."
python3 -m venv venv

if [ $? -ne 0 ]; then
    echo "Error: Failed to create virtual environment."
    exit 1
fi

# Activate virtual environment
echo ""
echo "[3/6] Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "[4/6] Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "[5/6] Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    exit 1
fi

# Create necessary directories
echo ""
echo "[6/6] Creating necessary directories..."
mkdir -p uploads
mkdir -p results
mkdir -p models/thermal_wildlife_detection/weights

echo ""
echo "=========================================="
echo "Setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Train model: python train_thermal_model.py"
echo "   (This will take 2-4 hours with GPU)"
echo "3. Run backend: python app.py"
echo ""
echo "The API will be available at: http://localhost:5000"
echo "=========================================="
