#!/bin/bash
# Training Peaks Workout Tracker - Start Script

echo "🏃‍♂️ Training Peaks Workout Tracker"
echo "=================================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.7 or higher"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "📦 Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Create data directory if it doesn't exist
mkdir -p data

echo "✅ Starting application..."
echo ""
echo "🌐 Opening browser at: http://127.0.0.1:5000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Flask application
python3 app.py

