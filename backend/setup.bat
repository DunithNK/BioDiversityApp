@echo off
echo ==========================================
echo ThermalVital Monitor Backend Setup
echo ==========================================
echo.

REM Check Python version
echo [1/6] Checking Python version...
python --version

if %errorlevel% neq 0 (
    echo Error: Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Create virtual environment
echo.
echo [2/6] Creating virtual environment...
python -m venv venv

if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment.
    exit /b 1
)

REM Activate virtual environment
echo.
echo [3/6] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo [4/6] Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo.
echo [5/6] Installing dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    exit /b 1
)

REM Create necessary directories
echo.
echo [6/6] Creating necessary directories...
if not exist uploads mkdir uploads
if not exist results mkdir results
if not exist models\thermal_wildlife_detection\weights mkdir models\thermal_wildlife_detection\weights

echo.
echo ==========================================
echo Setup completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Activate virtual environment: venv\Scripts\activate
echo 2. Train model: python train_thermal_model.py
echo    (This will take 2-4 hours with GPU)
echo 3. Run backend: python app.py
echo.
echo The API will be available at: http://localhost:5000
echo ==========================================
pause
