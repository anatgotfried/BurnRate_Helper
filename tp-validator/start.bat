@echo off
REM Training Peaks Workout Tracker - Start Script for Windows

echo Training Peaks Workout Tracker
echo ==================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed
    echo Please install Python 3.7 or higher
    pause
    exit /b 1
)

REM Check if dependencies are installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Create data directory if it doesn't exist
if not exist "data\" mkdir data

echo Starting application...
echo.
echo Opening browser at: http://127.0.0.1:5000
echo Press Ctrl+C to stop the server
echo.

REM Start the Flask application
python app.py

