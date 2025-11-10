# Quick Start Checklist

## First-Time Setup

### 1. Prerequisites Check
- [ ] Python 3.10+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Docker & Docker Compose installed (optional, for Docker setup)

### 2. Choose Your Setup Method

#### Option A: Docker (Easiest)
```bash
# 1. Set admin token (optional, defaults to 'changeme')
export ADMIN_TOKEN=changeme  # Linux/macOS
# or
set ADMIN_TOKEN=changeme     # Windows CMD
# or
$env:ADMIN_TOKEN="changeme"  # Windows PowerShell

# 2. Start services
docker-compose up --build

# 3. Access
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

#### Option B: Local Development

**Windows:**
```powershell
# 1. Backend setup
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env and set ADMIN_TOKEN=changeme

# 2. Frontend setup
cd ..\frontend
npm install
# Create .env file with: VITE_API_BASE_URL=http://localhost:8000

# 3. Run both (use two terminals or the script)
.\scripts\dev.ps1
```

**Linux/macOS:**
```bash
# 1. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set ADMIN_TOKEN=changeme

# 2. Frontend setup
cd ../frontend
npm install
# Create .env file with: VITE_API_BASE_URL=http://localhost:8000

# 3. Run both
chmod +x ../scripts/dev.sh
../scripts/dev.sh
```

### 3. Initial Data Setup

```bash
# Import sample data
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
python scripts/import_csv.py ../data/student_data_sample.csv
```

### 4. Train the Model

**Via API:**
```bash
curl -X POST "http://localhost:8000/api/retrain" \
  -H "Authorization: Bearer changeme"
```

**Via Frontend:**
1. Navigate to http://localhost:5173/admin
2. Login with token: `changeme`
3. Click "Retrain Model"

### 5. Test Prediction

**Via API:**
```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{"attendance":82,"marks":75,"internal_score":20}'
```

**Via Frontend:**
1. Navigate to http://localhost:5173
2. Fill in the form (attendance, marks, internal_score)
3. Click "Predict"

## Verification Checklist

- [ ] Backend health check: `curl http://localhost:8000/health` returns `{"status":"ok"}`
- [ ] Frontend loads at http://localhost:5173
- [ ] Can make predictions via frontend
- [ ] Can login to admin panel
- [ ] Can retrain model via admin panel
- [ ] Can view students list
- [ ] Can create/edit/delete students

## Common Issues

### Backend won't start
- Check Python version: `python --version` (need 3.10+)
- Activate virtual environment
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is available

### Frontend won't start
- Check Node.js version: `node --version` (need 18+)
- Install dependencies: `npm install`
- Check port 5173 is available
- Verify `.env` file exists with `VITE_API_BASE_URL`

### Model not found error
- Train the model first: `/api/retrain` endpoint
- Check `models/` directory exists and is writable

### Database errors
- Delete `backend/db.sqlite` to reset
- Re-run import script
- Check file permissions

## Next Steps

1. Explore the API documentation at http://localhost:8000/docs
2. Try different prediction inputs
3. Add more students and enrollments
4. Retrain the model with new data
5. Run batch predictions

## Production Deployment

For production:
1. Set secure `ADMIN_TOKEN`
2. Use PostgreSQL instead of SQLite
3. Build frontend: `cd frontend && npm run build`
4. Use production WSGI server (Gunicorn) for backend
5. Enable HTTPS
6. Set up proper logging and monitoring

