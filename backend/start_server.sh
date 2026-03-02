#!/bin/bash

# Start the Wildlife Tracking Backend Server
# Usage: ./start_server.sh

echo "=========================================="
echo "🚀 Starting Wildlife Tracking Backend"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Please run ./setup.sh first"
    exit 1
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Check if model exists
if [ ! -f "models/leopard_detector.h5" ]; then
    echo "⚠️  Warning: Model not found at models/leopard_detector.h5"
    echo "   The server will start but predictions will fail"
    echo "   Train the model with: python train_model.py"
    echo ""
fi

# Get local IP
echo "🌐 Server will be accessible at:"
echo "   http://localhost:8000"

if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}')
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}' | cut -d'/' -f1)
fi

if [ ! -z "$LOCAL_IP" ]; then
    echo "   http://$LOCAL_IP:8000 (use this in React Native app)"
fi

echo ""
echo "=========================================="
echo ""

# Start server
python main.py
