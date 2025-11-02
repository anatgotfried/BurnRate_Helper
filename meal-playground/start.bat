@echo off
REM BurnRate Meal Playground - Startup Script (Windows)

echo.
echo 🍽️  Starting BurnRate Meal Playground...
echo.

REM Check if .env file exists
if not exist .env (
    echo ⚠️  Warning: .env file not found!
    echo Please create a .env file with your OpenRouter API key.
    echo See ENV_SETUP.md for instructions.
    echo.
    pause
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed!
    echo Please install Python 3.7 or higher.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo 📦 Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo 📦 Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo ✅ Environment ready!
echo 🚀 Starting Flask server on http://127.0.0.1:5001
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py

