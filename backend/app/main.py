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
from .ml.train import METADATA_PATH_DEFAULT, MODEL_PATH_DEFAULT, train_from_db
from .ml.predictor import InvalidInputError, Predictor


logger = logging.getLogger(__name__)

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
    # Ensure models directory exists
    os.makedirs("./models", exist_ok=True)
    os.makedirs("./data", exist_ok=True)


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
def predict(
    request: schemas.PredictRequest,
    db: Session = Depends(get_db)
):
    """
    Predict student performance based on input features.
    Public endpoint - no authentication required.
    """
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not trained yet. Please train the model first using /api/retrain",
        )
    except Exception as exc:  # pragma: no cover - unexpected paths
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(exc)}",
        )


@app.post("/api/predict_batch", response_model=schemas.PredictBatchResponseList)
def predict_batch(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_token)
):
    """
    Run batch predictions for all enrollments in the database.
    Admin endpoint - requires authentication.
    """
    try:
        predictor = Predictor(model_path=MODEL_PATH, metadata_path=METADATA_PATH)

        # Get all enrollments
        enrollments = crud.get_all_enrollments_for_batch_prediction(db)
        
        # Prepare data for prediction
        prediction_data = []
        for enrollment in enrollments:
            if (enrollment.attendance is not None and
                enrollment.marks is not None and
                enrollment.internal_score is not None):
                prediction_data.append({
                    'student_id': enrollment.student_id,
                    'course_id': enrollment.course_id,
                    'attendance': enrollment.attendance,
                    'marks': enrollment.marks,
                    'internal_score': enrollment.internal_score
                })
        
        if not prediction_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No enrollments with complete data found for prediction"
            )
        
        # Run predictions
        predictions = predictor.predict_batch(prediction_data)

        return {
            "predictions": predictions,
            "total": len(predictions)
        }
    except InvalidInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not trained yet. Please train the model first using /api/retrain"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction error: {str(exc)}"
        )


@app.post("/api/retrain", response_model=schemas.RetrainResponse)
def retrain(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_token)
):
    """
    Retrain the ML model using data from the enrollments table.
    Admin endpoint - requires authentication.
    """
    try:
        enrollments = crud.get_training_data(db)

        if len(enrollments) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient training data. Need at least 10 samples with complete data, got {len(enrollments)}"
            )

        _, metrics, metadata = train_from_db(
            enrollments,
            model_path=MODEL_PATH,
            metadata_path=METADATA_PATH,
        )

        return {
            "accuracy": metrics['accuracy'],
            "precision": metrics['precision'],
            "recall": metrics['recall'],
            "f1_score": metrics['f1_score'],
            "roc_auc": metadata.get('roc_auc'),
            "model_path": MODEL_PATH,
            "metadata_path": METADATA_PATH,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "samples_used": len(enrollments),
            "class_distribution": metadata.get('class_distribution', {}),
            "class_counts": metadata.get('class_counts', {}),
            "recommended_threshold": metadata.get('recommended_threshold', 0.6),
            "metrics_cv": metadata.get('metrics_cv', {}),
            "user_threshold": metadata.get('user_threshold'),
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except HTTPException as exc:
        raise exc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training error: {str(e)}"
        )


@app.post("/api/settings/threshold", response_model=schemas.UpdateThresholdResponse)
def update_threshold(
    payload: schemas.UpdateThresholdRequest,
    _: None = Depends(verify_admin_token)
):
    """Allow admin to persist a custom decision threshold."""
    threshold = payload.threshold

    if not 0.0 < threshold < 1.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Threshold must be between 0 and 1.",
        )

    metadata: dict = {}
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as fp:
                loaded = json.load(fp)
            if isinstance(loaded, dict):
                metadata = loaded
        except json.JSONDecodeError as exc:
            logger.warning("Failed to parse metadata for threshold update: %s", exc)
            metadata = {}

    metadata["user_threshold"] = float(threshold)
    metadata.setdefault("recommended_threshold", max(0.6, float(threshold)))
    metadata["user_threshold_set_at"] = datetime.utcnow().isoformat() + "Z"

    os.makedirs(os.path.dirname(METADATA_PATH), exist_ok=True)
    with open(METADATA_PATH, "w", encoding="utf-8") as fp:
        json.dump(metadata, fp, indent=2)

    return {
        "threshold": float(threshold),
        "source": "metadata",
    }


@app.get("/api/settings/threshold", response_model=schemas.UpdateThresholdResponse)
def get_threshold(_: None = Depends(verify_admin_token)):
    threshold, source = _resolve_threshold_with_source()
    return {
        "threshold": threshold,
        "source": source,
    }


# Student CRUD endpoints
@app.get("/api/students", response_model=schemas.PaginatedStudents)
def get_students(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get all students with pagination."""
    skip = (page - 1) * limit
    students, total = crud.get_students(db, skip=skip, limit=limit)
    pages = (total + limit - 1) // limit  # Ceiling division
    
    return {
        "items": students,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }


@app.get("/api/students/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student by ID."""
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )
    return student


@app.post("/api/students", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """Create a new student."""
    return crud.create_student(db, student)


@app.put("/api/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db)
):
    """Update a student."""
    student = crud.update_student(db, student_id, student_update)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )
    return student


@app.delete("/api/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student."""
    success = crud.delete_student(db, student_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )


# Export endpoint
@app.post("/api/export")
def export_data(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin_token)
):
    """
    Export training-ready CSV from current database.
    Admin endpoint - requires authentication.
    """
    try:
        enrollments = crud.get_training_data(db)
        
        if not enrollments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No training data available to export"
            )
        
        # Prepare CSV file
        csv_path = "./data/student_data_export.csv"
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'student_id', 'course_id', 'attendance', 'marks',
                'internal_score', 'final_exam_score', 'result'
            ])
            
            for enrollment in enrollments:
                writer.writerow([
                    enrollment.student_id,
                    enrollment.course_id,
                    enrollment.attendance,
                    enrollment.marks,
                    enrollment.internal_score,
                    enrollment.final_exam_score,
                    enrollment.result
                ])
        
        return FileResponse(
            csv_path,
            media_type='text/csv',
            filename='student_data_export.csv'
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export error: {str(e)}"
        )

