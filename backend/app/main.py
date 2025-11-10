"""FastAPI main application file."""
import csv
import json
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db, init_db
from .ml.train import (
    METADATA_PATH_DEFAULT,
    MODEL_PATH_DEFAULT,
    DATA_DIR,
    train_from_csv,
)
from .ml.predictor import InvalidInputError, Predictor


logger = logging.getLogger(__name__)

# Get base directory (backend directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR_ABS = os.path.join(BASE_DIR, "data")

# Initialize FastAPI app
app = FastAPI(
    title="Student Performance Prediction System",
    description="API for predicting student performance using ML",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    """Initialize database tables on startup."""
    init_db()
    # Ensure models and data directories exist
    os.makedirs(os.path.join(BASE_DIR, "models"), exist_ok=True)
    os.makedirs(DATA_DIR_ABS, exist_ok=True)
    
    # Verify data files exist - use print for visibility in logs
    sample_csv = os.path.join(DATA_DIR_ABS, "student_data_sample.csv")
    print(f"🔍 Checking for data file at: {sample_csv}")
    print(f"📁 BASE_DIR: {BASE_DIR}")
    print(f"📁 DATA_DIR_ABS: {DATA_DIR_ABS}")
    print(f"📁 Current working directory: {os.getcwd()}")
    
    if not os.path.exists(sample_csv):
        print(f"⚠️  WARNING: student_data_sample.csv not found at {sample_csv}")
        print("   The /api/retrain endpoint may not work until the file is available.")
        logger.warning(f"⚠️  Warning: student_data_sample.csv not found at {sample_csv}")
        logger.warning("   The /api/retrain endpoint may not work until the file is available.")
        
        # List what's actually in the data directory
        if os.path.exists(DATA_DIR_ABS):
            print(f"📂 Contents of {DATA_DIR_ABS}:")
            try:
                for item in os.listdir(DATA_DIR_ABS):
                    print(f"   - {item}")
            except Exception as e:
                print(f"   Error listing directory: {e}")
    else:
        print(f"✅ Found student_data_sample.csv at {sample_csv}")
        logger.info(f"✅ Found student_data_sample.csv at {sample_csv}")


# Admin token validation
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "changeme")
MODEL_PATH = os.getenv("MODEL_PATH", MODEL_PATH_DEFAULT)
METADATA_PATH = os.getenv("MODEL_METADATA_PATH", METADATA_PATH_DEFAULT)


def _resolve_threshold_with_source() -> tuple[float, str]:
    env_threshold = os.getenv("PRED_THRESHOLD")
    if env_threshold:
        try:
            threshold = float(env_threshold)
            if 0.0 < threshold < 1.0:
                return threshold, "env"
        except ValueError:
            logger.warning("Invalid PRED_THRESHOLD in environment: %s", env_threshold)

    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as fp:
                metadata = json.load(fp)
            if isinstance(metadata, dict):
                user_threshold = metadata.get("user_threshold")
                if isinstance(user_threshold, (float, int)) and 0.0 < float(user_threshold) < 1.0:
                    return float(user_threshold), "metadata:user"
                recommended = metadata.get("recommended_threshold")
                if isinstance(recommended, (float, int)) and 0.0 < float(recommended) < 1.0:
                    return float(recommended), "metadata:recommended"
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Unable to read metadata for threshold: %s", exc)

    return 0.6, "default"


def verify_admin_token(authorization: Optional[str] = Header(None)):
    """Verify admin token from Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        token = authorization.replace("Bearer ", "")
        if token != ADMIN_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin token"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )


# Health check endpoint
@app.get("/health", response_model=schemas.HealthResponse)
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Prediction endpoints
@app.post("/api/predict", response_model=schemas.PredictResponse)
def predict(request: schemas.PredictRequest, db: Session = Depends(get_db)):
    """Predict student performance."""
    try:
        predictor = Predictor(model_path=MODEL_PATH, metadata_path=METADATA_PATH)
        result = predictor.predict(
            attendance=request.attendance,
            marks=request.marks,
            internal_score=request.internal_score,
            final_exam_score=request.final_exam_score,
        )
        return result
    except InvalidInputError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not trained yet. Please train the model first using /api/retrain",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(exc)}",
        )


@app.post("/api/predict_batch", response_model=schemas.PredictBatchResponseList)
def predict_batch(db: Session = Depends(get_db), _: None = Depends(verify_admin_token)):
    """Batch prediction for all students."""
    try:
        predictor = Predictor(model_path=MODEL_PATH, metadata_path=METADATA_PATH)
        enrollments = crud.get_all_enrollments_for_batch_prediction(db)

        prediction_data = []
        for enrollment in enrollments:
            if (enrollment.attendance is not None and
                enrollment.marks is not None and
                enrollment.internal_score is not None):
                prediction_data.append({
                    "student_id": enrollment.student_id,
                    "course_id": enrollment.course_id,
                    "attendance": enrollment.attendance,
                    "marks": enrollment.marks,
                    "internal_score": enrollment.internal_score
                })

        if not prediction_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No enrollments with complete data found for prediction. Please ensure students have attendance, marks, and internal_score values."
            )

        predictions = predictor.predict_batch(prediction_data)
        return {"predictions": predictions, "total": len(predictions)}
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model not trained yet. Please train the model first using /api/retrain. Error: {str(exc)}"
        )
    except InvalidInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(exc)}"
        )
    except Exception as exc:
        logger.error(f"Batch prediction error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction error: {str(exc)}"
        )


# ✅ FIXED Retrain Endpoint
@app.post("/api/retrain", response_model=schemas.RetrainResponse)
def retrain(_: None = Depends(verify_admin_token)):
    """Retrain ML model using CSV data."""
    try:
        csv_path = os.path.join(DATA_DIR_ABS, "student_data_sample.csv")
        _, metrics, metadata = train_from_csv(
            csv_path=csv_path,
            model_path=MODEL_PATH,
            metadata_path=METADATA_PATH,
        )

        return {
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "roc_auc": metadata.get("roc_auc"),
            "model_path": MODEL_PATH,
            "metadata_path": METADATA_PATH,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "samples_used": metadata.get("samples_used", 0),
            "class_distribution": metadata.get("class_distribution", {}),
            "class_counts": metadata.get("class_counts", {}),
            "recommended_threshold": metadata.get("recommended_threshold", 0.6),
            "metrics_cv": metadata.get("metrics_cv", {}),
            "user_threshold": metadata.get("user_threshold"),
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CSV file not found. Please ensure student_data_sample.csv exists in /data.",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training error: {str(e)}",
        )


@app.post("/api/settings/threshold", response_model=schemas.UpdateThresholdResponse)
def update_threshold(payload: schemas.UpdateThresholdRequest, _: None = Depends(verify_admin_token)):
    """Allow admin to persist a custom decision threshold."""
    threshold = payload.threshold
    if not 0.0 < threshold < 1.0:
        raise HTTPException(status_code=400, detail="Threshold must be between 0 and 1.")

    metadata = {}
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as fp:
                loaded = json.load(fp)
                if isinstance(loaded, dict):
                    metadata = loaded
        except json.JSONDecodeError:
            metadata = {}

    metadata["user_threshold"] = float(threshold)
    metadata["user_threshold_set_at"] = datetime.utcnow().isoformat() + "Z"

    os.makedirs(os.path.dirname(METADATA_PATH), exist_ok=True)
    with open(METADATA_PATH, "w", encoding="utf-8") as fp:
        json.dump(metadata, fp, indent=2)

    return {"threshold": float(threshold), "source": "metadata"}


@app.get("/api/settings/threshold", response_model=schemas.UpdateThresholdResponse)
def get_threshold(_: None = Depends(verify_admin_token)):
    threshold, source = _resolve_threshold_with_source()
    return {"threshold": threshold, "source": source}


# Student CRUD endpoints
@app.get("/api/students", response_model=schemas.PaginatedStudents)
def get_students(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    skip = (page - 1) * limit
    students, total = crud.get_students(db, skip=skip, limit=limit)
    pages = (total + limit - 1) // limit
    return {"items": students, "total": total, "page": page, "limit": limit, "pages": pages}


@app.get("/api/students/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with ID {student_id} not found")
    return student


@app.post("/api/students", response_model=schemas.StudentResponse, status_code=201)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    return crud.create_student(db, student)


@app.put("/api/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(student_id: int, student_update: schemas.StudentUpdate, db: Session = Depends(get_db)):
    student = crud.update_student(db, student_id, student_update)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with ID {student_id} not found")
    return student


@app.delete("/api/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    success = crud.delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Student with ID {student_id} not found")


@app.post("/api/export")
def export_data(db: Session = Depends(get_db), _: None = Depends(verify_admin_token)):
    """Export student data as CSV."""
    try:
        enrollments = crud.get_training_data(db)
        if not enrollments:
            raise HTTPException(status_code=400, detail="No data available for export")

        csv_path = os.path.join(DATA_DIR_ABS, "student_data_export.csv")
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "student_id", "course_id", "attendance", "marks",
                "internal_score", "final_exam_score", "result"
            ])
            for e in enrollments:
                writer.writerow([
                    e.student_id, e.course_id, e.attendance, e.marks,
                    e.internal_score, e.final_exam_score, e.result
                ])

        return FileResponse(csv_path, media_type="text/csv", filename="student_data_export.csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")
