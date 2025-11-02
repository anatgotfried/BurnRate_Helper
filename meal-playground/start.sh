#!/bin/bash

# BurnRate Meal Playground - Startup Script (Mac/Linux)

echo "🍽️  Starting BurnRate Meal Playground..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create a .env file with your OpenRouter API key."
    echo "See ENV_SETUP.md for instructions."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed!"
    echo "Please install Python 3.7 or higher."
    exit 1
fi

# Check if requirements are installed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "✅ Environment ready!"
echo "🚀 Starting Flask server on http://127.0.0.1:5001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python app.py

