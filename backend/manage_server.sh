#!/bin/bash
# Backend Server Management Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

case "$1" in
  start)
    echo "🚀 Starting backend server..."
    ./venv/bin/python3 main.py
    ;;
    
  stop)
    echo "🛑 Stopping backend server..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Server stopped" || echo "⚠️  No server running"
    ;;
    
  restart)
    echo "🔄 Restarting backend server..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
    ./venv/bin/python3 main.py
    ;;
    
  status)
    if lsof -ti:8000 >/dev/null 2>&1; then
      echo "✅ Backend server is RUNNING on port 8000"
      curl -s http://localhost:8000/health | python3 -m json.tool
    else
      echo "❌ Backend server is NOT running"
    fi
    ;;
    
  *)
    echo "Wildlife Tracking API - Server Management"
    echo ""
    echo "Usage: $0 {start|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the backend server"
    echo "  stop    - Stop the backend server"
    echo "  restart - Restart the backend server"
    echo "  status  - Check server status"
    exit 1
    ;;
esac
