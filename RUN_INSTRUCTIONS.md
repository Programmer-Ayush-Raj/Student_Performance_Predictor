# Step-by-Step Instructions to Run the Project

## Prerequisites
- Python 3.10+ installed
- Node.js and npm installed
- PowerShell or Command Prompt

## Step 1: Navigate to Project Directory

Open a terminal (PowerShell or Command Prompt) and navigate to the project directory:

```powershell
cd "C:\Users\rajay\Documents\BCSE306L - Artificial Intelligence\Digital Assignment\Project\AI_Personalized_Feedback_System"
```

## Step 2: Set Up Backend (First Terminal Window)

### 2.1 Navigate to Backend Directory
```powershell
cd backend
```

### 2.2 Create Virtual Environment (if not exists)
```powershell
python -m venv venv
```

### 2.3 Activate Virtual Environment

**For PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**For Command Prompt (cmd):**
```cmd
venv\Scripts\activate.bat
```

### 2.4 Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### 2.5 Start Backend Server
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep this terminal window open!**

## Step 3: Set Up Frontend (Second Terminal Window)

Open a **NEW** terminal window and navigate to the project directory:

```powershell
cd "C:\Users\rajay\Documents\BCSE306L - Artificial Intelligence\Digital Assignment\Project\AI_Personalized_Feedback_System"
```

### 3.1 Navigate to Frontend Directory
```powershell
cd frontend
```

### 3.2 Install Node Dependencies (if not already installed)
```powershell
npm install
```

### 3.3 Start Frontend Development Server
```powershell
npm run dev
```

You should see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Keep this terminal window open!**

## Step 4: Access the Application

1. **Frontend Application**: Open your browser and go to:
   ```
   http://localhost:5173
   ```

2. **Backend API**: The API is available at:
   ```
   http://localhost:8000
   ```

3. **API Documentation**: View interactive API docs at:
   ```
   http://localhost:8000/docs
   ```

## Step 5: Verify Everything is Working

### Check Backend Health
Open a new terminal and run:
```powershell
curl http://localhost:8000/health
```

Or in PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health
```

You should get: `{"status":"ok"}`

### Check Frontend
Open your browser and navigate to `http://localhost:5173`. You should see the application interface.

## Stopping the Services

To stop the services:
1. Go to the terminal window running the backend
2. Press `Ctrl + C` to stop the backend server
3. Go to the terminal window running the frontend
4. Press `Ctrl + C` to stop the frontend server

## Quick Start (Alternative Method)

If you prefer to use the provided script:

### For PowerShell:
```powershell
.\scripts\dev.ps1
```

### For Bash (Git Bash or WSL):
```bash
bash scripts/dev.sh
```

## Troubleshooting

### Backend Issues:
- **Port 8000 already in use**: Change the port in the uvicorn command:
  ```powershell
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
  ```
  Then update `frontend/src/api.ts` to use port 8001.

- **Virtual environment not activating**: Make sure you're in the `backend` directory and the `venv` folder exists.

- **Module not found errors**: Make sure you've activated the virtual environment and installed requirements.

### Frontend Issues:
- **Port 5173 already in use**: Vite will automatically try the next available port.

- **npm install fails**: Try clearing the cache:
  ```powershell
  npm cache clean --force
  npm install
  ```

- **Module not found**: Delete `node_modules` and `package-lock.json`, then run `npm install` again.

### Database Issues:
- The database will be automatically created when the backend starts.
- If you need to reset the database, delete `backend/db.sqlite` and restart the backend.

## Summary

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

**Browser:**
- Open: `http://localhost:5173`

That's it! Your application should now be running.

