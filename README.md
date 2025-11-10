# Student Performance Prediction System

A full-stack machine learning application that predicts whether a student will pass (1) or fail (0) a course based on their attendance, marks, and internal scores.

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, scikit-learn, joblib
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Axios
- **Database**: SQLite
- **ML Model**: Logistic Regression (scikit-learn)
- **Containerization**: Docker & Docker Compose

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py           # Database configuration
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── crud.py               # CRUD operations
│   │   └── ml/
│   │       ├── train.py          # ML training pipeline
│   │       └── predictor.py     # ML prediction pipeline
│   ├── scripts/
│   │   └── import_csv.py         # CSV import script
│   ├── tests/
│   │   └── test_api.py           # API tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Predictor.tsx    # Prediction page
│   │   │   ├── Students.tsx      # Students management
│   │   │   └── Admin.tsx         # Admin panel
│   │   ├── api.ts                # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── data/
│   └── student_data_sample.csv   # Sample training data
├── scripts/
│   ├── dev.sh                    # Linux/macOS dev script
│   └── dev.ps1                   # Windows dev script
├── docker-compose.yml
├── Makefile
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)

1. **Clone and navigate to the project**:
   ```bash
   cd DBMS-main
   ```

2. **Set environment variables**:
   ```bash
   # Copy .env.example to .env in backend (if needed)
   cp backend/.env.example backend/.env
   # Edit backend/.env and set ADMIN_TOKEN
   ```

3. **Start services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### Windows

1. **Setup Backend**:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Setup Frontend**:
   ```powershell
   cd frontend
   npm install
   ```

3. **Create .env file in backend**:
   ```powershell
   # Copy .env.example
   copy .env.example .env
   # Edit .env and set ADMIN_TOKEN=changeme
   ```

4. **Run both services**:
   ```powershell
   # Option A: Use PowerShell script
   .\scripts\dev.ps1
   
   # Option B: Run manually in separate terminals
   # Terminal 1 (Backend):
   cd backend
   .\venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload
   
   # Terminal 2 (Frontend):
   cd frontend
   npm run dev
   ```

#### Linux/macOS

1. **Setup Backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   ```

3. **Create .env file in backend**:
   ```bash
   cp .env.example .env
   # Edit .env and set ADMIN_TOKEN=changeme
   ```

4. **Run both services**:
   ```bash
   # Option A: Use shell script
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   
   # Option B: Use Makefile
   make dev
   
   # Option C: Run manually in separate terminals
   # Terminal 1 (Backend):
   cd backend && source venv/bin/activate && uvicorn app.main:app --reload
   
   # Terminal 2 (Frontend):
   cd frontend && npm run dev
   ```

## Initial Setup & Training

### 1. Import Sample Data

```bash
# From project root
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
python scripts/import_csv.py ../data/student_data_sample.csv
```

### 2. Train the Model

**Option A: Via API (Admin required)**:
```bash
curl -X POST "http://localhost:8000/api/retrain" \
  -H "Authorization: Bearer changeme"
```

**Option B: Via Frontend**:
1. Navigate to http://localhost:5173/admin
2. Login with admin token (default: `changeme`)
3. Click "Retrain Model"

### 3. Test Prediction

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance": 82,
    "marks": 75,
    "internal_score": 20
  }'
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `POST /api/predict` - Single prediction
  ```json
  {
    "attendance": 82,
    "marks": 75,
    "internal_score": 20,
    "final_exam_score": 65  // optional
  }
  ```

### Admin Endpoints (Require `Authorization: Bearer <ADMIN_TOKEN>`)

- `POST /api/retrain` - Retrain model from database
- `POST /api/predict_batch` - Batch prediction for all enrollments
- `POST /api/export` - Export training data as CSV

### Student CRUD

- `GET /api/students?page=1&limit=10` - List students (paginated)
- `GET /api/students/{student_id}` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/{student_id}` - Update student
- `DELETE /api/students/{student_id}` - Delete student

## Example API Calls

### Predict Single Student

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance": 82,
    "marks": 75,
    "internal_score": 20
  }'
```

**Response**:
```json
{
  "predicted_result": 1,
  "probability": 0.85
}
```

### Retrain Model (Admin)

```bash
curl -X POST "http://localhost:8000/api/retrain" \
  -H "Authorization: Bearer changeme"
```

**Response**:
```json
{
  "accuracy": 0.92,
  "precision": 0.90,
  "recall": 0.95,
  "f1_score": 0.92,
  "model_path": "./models/marks_classifier.joblib",
  "timestamp": "2024-01-15T10:30:00",
  "samples_used": 50
}
```

### Batch Prediction (Admin)

```bash
curl -X POST "http://localhost:8000/api/predict_batch" \
  -H "Authorization: Bearer changeme"
```

**Response**:
```json
{
  "predictions": [
    {
      "student_id": 1,
      "course_id": 1,
      "predicted_result": 1,
      "probability": 0.85
    }
  ],
  "total": 1
}
```

## Frontend Pages

1. **Predictor** (`/`) - Input form for single predictions
2. **Students** (`/students`) - Manage students, view enrollments, run batch predictions
3. **Admin** (`/admin`) - Login, retrain model, export data

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Environment Variables

### Backend (.env)

```env
ADMIN_TOKEN=changeme
DATABASE_URL=sqlite:///./db.sqlite
MODEL_PATH=./models/marks_classifier.joblib
MODEL_METADATA_PATH=./models/metadata.json
PRED_THRESHOLD=0.6
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## ML Model Details

- **Algorithm**: Logistic Regression (scikit-learn)
- **Features**: `attendance`, `marks`, `internal_score`
- **Target**: `result` (1 = pass, 0 = fail)
- **Preprocessing**: StandardScaler
- **Train/Test Split**: 80/20 (random_state=42)
- **Model Persistence**: joblib format

**Leakage avoidance**: Only inputs guaranteed at prediction time (`attendance`, `marks`, `internal_score`) are used. The `final_exam_score` column is deliberately excluded to avoid leaking information that is only known after the final exam.

**Probability calibration & decision threshold**: Logistic Regression is wrapped in `CalibratedClassifierCV` (cv=5) to provide well-calibrated probabilities. The default prediction threshold is intentionally conservative (`0.6`) to reduce false positives; admins can adjust it via the `/api/settings/threshold` endpoint or the Admin UI (which persists the value in `MODEL_METADATA_PATH`).

**Explainability**: Training yields metadata (`models/metadata.json`) containing feature coefficients, permutation importances, class distribution, and the recommended threshold. Each prediction returns top contributing features and flags suspicious inputs (e.g., zero marks with high internal scores) so reviewers can double-check inconsistent records.

## Troubleshooting

### Backend won't start

- Check Python version: `python --version` (should be 3.10+)
- Ensure virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`
- Check if port 8000 is available

### Frontend won't start

- Check Node.js version: `node --version` (should be 18+)
- Install dependencies: `npm install`
- Check if port 5173 is available
- Verify `VITE_API_BASE_URL` in `.env`

### Model not found error

- Train the model first using `/api/retrain` endpoint
- Ensure `models/` directory exists and is writable

### Database errors

- Ensure SQLite file permissions are correct
- Delete `db.sqlite` to reset database (will lose data)
- Re-run import script to populate data

## Technical Note: Implausible Pass Predictions

Earlier builds occasionally predicted a pass even when marks were zero because the model was trained with features (`final_exam_score`) that are not available at decision time and its raw probabilities were used with a permissive 0.5 threshold. The new pipeline trains only on leak-free features, calibrates probabilities across five folds, and recommends a conservative default threshold (0.6). Inference now validates inputs, flags suspicious combinations, and returns feature-level explanations so reviewers understand which signals drove the result. Admins can persist a custom threshold, ensuring the predictor stays aligned with operational tolerance for risk.

## Feedback & AI-Suggested Improvements

Generative AI review highlighted a few next steps that could further harden the system:

- **Model robustness**: capture more recent cohorts and add stratified time-based splits to detect performance drift over semesters. Combine with a scheduled retraining checklist and automatic metric regression tests.
- **Explainability depth**: experiment with lightweight SHAP KernelExplainer caching to provide per-feature directionality against historical baselines, while keeping latency budgets in check.
- **Data quality monitoring**: log validator warnings (e.g., suspicious inputs) into an audit table or observability dashboard so academic staff can trend potential data-entry issues.
- **Threshold governance**: expose ROC/PR curves and allow admins to simulate “what-if” thresholds before saving, ensuring the chosen cut-off reflects current risk tolerance.
- **Operational safeguards**: bundle the calibration metadata and model file into a single artifact with checksums, and add CI gates to fail builds if calibration metrics degrade beyond a configurable tolerance.

### How feedback suggestions are computed

- Server computes actionable suggestions using a linear log-odds approximation with the trained Logistic Regression coefficients and the `StandardScaler` statistics saved in `models/metadata.json`.
- For each feature (`attendance`, `marks`, `internal_score`), the backend proposes a modest, realistic improvement (caps by default: +10, +15, +10 respectively) and estimates the probability gain by:
  - scaling the delta by the feature's standard deviation, multiplying by the corresponding coefficient (delta_log_odds), and shifting the current log-odds; the gain is the difference between the new sigmoid probability and the current probability.
- The API returns these as a `feedback` array with `feature`, `suggested_change`, `estimated_probability_gain`, `new_probability_estimate`, `priority`, and a short explanation. The Predictor UI displays them and allows quick simulation (advisory; original prediction remains unchanged).

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/app/main.py`, schemas in `backend/app/schemas.py`
2. **Frontend**: Add pages in `frontend/src/pages/`, update `frontend/src/App.tsx` routing
3. **API Client**: Update `frontend/src/api.ts` with new endpoints

### Database Migrations

Currently using SQLAlchemy's `create_all()`. For production, consider Alembic for migrations.

## Production Deployment

1. Build frontend: `cd frontend && npm run build`
2. Serve static files with nginx or similar
3. Use production WSGI server (e.g., Gunicorn) for backend
4. Set secure `ADMIN_TOKEN` in environment
5. Use PostgreSQL instead of SQLite for production
6. Enable HTTPS

## License

This project is for educational purposes.

## Support

For issues or questions, please check:
- API documentation: http://localhost:8000/docs
- FastAPI docs: https://fastapi.tiangolo.com
- React docs: https://react.dev
