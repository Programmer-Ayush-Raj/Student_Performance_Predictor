# PowerShell script to run both backend and frontend concurrently

Write-Host "Starting Student Performance Prediction System..." -ForegroundColor Blue

# Check if virtual environment exists
if (-not (Test-Path "backend\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    Set-Location ..
}

# Start backend
Write-Host "Starting backend..." -ForegroundColor Green
Set-Location backend
.\venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WindowStyle Hidden
Set-Location ..

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Green
Set-Location frontend
npm install --silent
Start-Process npm -ArgumentList "run", "dev" -WindowStyle Hidden
Set-Location ..

Write-Host "Backend running on http://localhost:8000" -ForegroundColor Blue
Write-Host "Frontend running on http://localhost:5173" -ForegroundColor Blue
Write-Host "Press any key to stop both services..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop processes (this is a simplified version - you may need to manually stop)
Get-Process | Where-Object { $_.ProcessName -eq "python" -or $_.ProcessName -eq "node" } | Stop-Process -Force

