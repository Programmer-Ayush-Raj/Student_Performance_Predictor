"""Training module for Student Performance Prediction."""
import os
import joblib
import pandas as pd
from typing import Dict, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

# Default paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

MODEL_PATH_DEFAULT = os.path.join(MODEL_DIR, "marks_classifier.joblib")
METADATA_PATH_DEFAULT = os.path.join(MODEL_DIR, "metadata.json")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


def train_model(df: pd.DataFrame, model_path: str, metadata_path: str) -> Tuple[CalibratedClassifierCV, Dict[str, float], Dict[str, object]]:
    """Train model using dataset and save artifacts."""
    X = df[["attendance", "marks", "internal_score"]]
    y = df["result"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    base_model = LogisticRegression(max_iter=200)
    model = CalibratedClassifierCV(base_model)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
    }

    metadata = {
        "roc_auc": float(roc_auc_score(y_test, y_proba)),
        "samples_used": int(len(df)),
        "class_counts": dict(df["result"].value_counts()),
        "recommended_threshold": 0.6,
    }

    # Save model + scaler + metadata
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump({"model": model, "scaler": scaler}, model_path)

    import json
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Model trained and saved to {model_path}")
    print(f"📄 Metadata saved to {metadata_path}")
    return model, metrics, metadata


def train_from_csv(
    csv_path: str = None,
    model_path: str = MODEL_PATH_DEFAULT,
    metadata_path: str = METADATA_PATH_DEFAULT,
) -> Tuple[CalibratedClassifierCV, Dict[str, float], Dict[str, object]]:
    """Train the model directly from a CSV file (works both locally and on Render)."""
    if csv_path is None:
        csv_path = os.path.join(DATA_DIR, "student_data_sample.csv")

    print(f"📂 Loading CSV from: {csv_path}")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["result"])

    if len(df) < 10:
        raise ValueError(f"Insufficient data for training. Need at least 10 samples, got {len(df)}")

    return train_model(df, model_path=model_path, metadata_path=metadata_path)
