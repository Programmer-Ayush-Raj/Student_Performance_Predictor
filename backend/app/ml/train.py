"""
ML training pipeline for student performance prediction.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Dict, Tuple, List

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.inspection import permutation_importance

logger = logging.getLogger(__name__)

FEATURES: List[str] = ["attendance", "marks", "internal_score"]
MODEL_PATH_DEFAULT = "./models/marks_classifier.joblib"
METADATA_PATH_DEFAULT = "./models/metadata.json"


def _validate_columns(df: pd.DataFrame) -> None:
    missing_cols = [col for col in FEATURES + ["result"] if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")


def _prepare_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Dict[str, float]]]:
    """Prepare features and record imputation statistics."""
    features = df[FEATURES].copy()
    imputation_stats: Dict[str, Dict[str, float]] = {}

    for col in FEATURES:
        missing = int(features[col].isna().sum())
        if missing > 0:
            median_val = float(features[col].median())
            features[col] = features[col].fillna(median_val)
            imputation_stats[col] = {"imputed_count": missing, "median_used": median_val}
            logger.warning("Filled %s missing values in %s with median %.2f", missing, col, median_val)
        else:
            imputation_stats[col] = {"imputed_count": 0}

    return features, imputation_stats


def _build_base_pipeline(random_state: int) -> Pipeline:
    return Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
                LogisticRegression(
                    solver="liblinear",
                    class_weight="balanced",
                    random_state=random_state,
                ),
            ),
        ]
    )


def _compute_metrics(
    X: pd.DataFrame, y: pd.Series, random_state: int
) -> Tuple[Dict[str, float], np.ndarray, float]:
    base_pipeline = _build_base_pipeline(random_state)
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
    }
    cv_results = cross_validate(
        base_pipeline,
        X,
        y,
        cv=5,
        scoring=scoring,
        n_jobs=None,
        return_estimator=True,
        error_score="raise",
    )

    metrics = {
        "accuracy": float(np.mean(cv_results["test_accuracy"])),
        "precision": float(np.mean(cv_results["test_precision"])),
        "recall": float(np.mean(cv_results["test_recall"])),
        "f1_score": float(np.mean(cv_results["test_f1"])),
    }

    # Average coefficients across folds for reference
    coefficients = np.mean(
        [estimator.named_steps["classifier"].coef_[0] for estimator in cv_results["estimator"]],
        axis=0,
    )

    intercept = float(
        np.mean(
            [estimator.named_steps["classifier"].intercept_[0] for estimator in cv_results["estimator"]]
        )
    )

    return metrics, coefficients, intercept


def _train_calibrated_model(X: pd.DataFrame, y: pd.Series, random_state: int) -> CalibratedClassifierCV:
    base_pipeline = _build_base_pipeline(random_state)
    calibrated_clf = CalibratedClassifierCV(estimator=base_pipeline, cv=5, method="sigmoid")
    calibrated_clf.fit(X, y)
    return calibrated_clf


def _compute_permutation_importance(model: Pipeline, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
    try:
        result = permutation_importance(
            model,
            X,
            y,
            n_repeats=20,
            random_state=42,
            n_jobs=None,
        )
        importances = result.importances_mean
        normalized = importances / np.sum(np.abs(importances)) if np.sum(np.abs(importances)) else importances
        return {feature: float(val) for feature, val in zip(FEATURES, normalized)}
    except Exception as exc:  # pragma: no cover - fallback scenario
        logger.warning("Permutation importance failed: %s", exc)
        return {feature: 0.0 for feature in FEATURES}


def _save_metadata(
    metadata_path: str,
    metadata: Dict[str, object],
) -> None:
    os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as existing_fp:
                existing_metadata = json.load(existing_fp)
            if (
                isinstance(existing_metadata, dict)
                and "user_threshold" in existing_metadata
                and "user_threshold" not in metadata
            ):
                metadata["user_threshold"] = existing_metadata["user_threshold"]
        except Exception as exc:  # pragma: no cover - best effort warning
            logger.warning("Unable to preserve existing metadata: %s", exc)
    with open(metadata_path, "w", encoding="utf-8") as fp:
        json.dump(metadata, fp, indent=2)


def train_model(
    data: pd.DataFrame,
    model_path: str = MODEL_PATH_DEFAULT,
    metadata_path: str = METADATA_PATH_DEFAULT,
    random_state: int = 42,
) -> Tuple[CalibratedClassifierCV, Dict[str, float], Dict[str, object]]:
    """Train calibrated Logistic Regression model and persist metadata."""

    logger.info("Starting model training with %d samples", len(data))
    _validate_columns(data)

    X, imputation_stats = _prepare_features(data)
    y = data["result"].astype(int)

    if y.nunique() < 2:
        raise ValueError("Training requires at least two classes in the target variable")

    class_counts = y.value_counts().to_dict()
    class_distribution = {int(cls): float(count / len(y)) for cls, count in class_counts.items()}

    metrics, coefficients, intercept = _compute_metrics(X, y, random_state)

    base_pipeline = _build_base_pipeline(random_state)
    base_pipeline.fit(X, y)

    calibrated_model = _train_calibrated_model(X, y, random_state)

    y_scores = calibrated_model.predict_proba(X)[:, 1]
    roc_auc = float(roc_auc_score(y, y_scores))
    fpr, tpr, thresholds = roc_curve(y, y_scores)

    best_threshold = 0.6
    best_f1 = -1.0
    for threshold in thresholds:
        preds = (y_scores >= threshold).astype(int)
        current_f1 = f1_score(y, preds, zero_division=0)
        if current_f1 > best_f1:
            best_f1 = current_f1
            best_threshold = float(threshold)

    best_threshold = float(max(best_threshold, 0.6))

    permutation_importances = _compute_permutation_importance(base_pipeline, X, y)

    metadata = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "feature_names": FEATURES,
        "class_counts": {int(k): int(v) for k, v in class_counts.items()},
        "class_distribution": class_distribution,
        "imputation": imputation_stats,
        "coefficients": {feature: float(weight) for feature, weight in zip(FEATURES, coefficients)},
        "intercept": intercept,
        "permutation_importance": permutation_importances,
        "metrics_cv": metrics,
        "roc_auc": roc_auc,
        "recommended_threshold": best_threshold,
        "scaler": {
            "mean": base_pipeline.named_steps["scaler"].mean_.tolist(),
            "scale": base_pipeline.named_steps["scaler"].scale_.tolist(),
        },
    }

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(calibrated_model, model_path)
    logger.info("Calibrated model saved to %s", model_path)

    _save_metadata(metadata_path, metadata)
    logger.info("Training metadata saved to %s", metadata_path)

    return calibrated_model, metrics, metadata


def _to_dataframe_from_enrollments(enrollments: List) -> pd.DataFrame:
    records: List[Dict[str, float]] = []
    for enrollment in enrollments:
        records.append(
            {
                "attendance": enrollment.attendance,
                "marks": enrollment.marks,
                "internal_score": enrollment.internal_score,
                "result": enrollment.result,
            }
        )
    df = pd.DataFrame(records)
    df = df.dropna(subset=["result"])
    return df


def train_from_db(
    enrollments: List,
    model_path: str = MODEL_PATH_DEFAULT,
    metadata_path: str = METADATA_PATH_DEFAULT,
) -> Tuple[CalibratedClassifierCV, Dict[str, float], Dict[str, object]]:
    df = _to_dataframe_from_enrollments(enrollments)

    if len(df) < 10:
        raise ValueError(f"Insufficient data for training. Need at least 10 samples, got {len(df)}")

    return train_model(df, model_path=model_path, metadata_path=metadata_path)


def train_from_csv(
    csv_path: str,
    model_path: str = MODEL_PATH_DEFAULT,
    metadata_path: str = METADATA_PATH_DEFAULT,
) -> Tuple[CalibratedClassifierCV, Dict[str, float], Dict[str, object]]:
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["result"])

    if len(df) < 10:
        raise ValueError(f"Insufficient data for training. Need at least 10 samples, got {len(df)}")

    return train_model(df, model_path=model_path, metadata_path=metadata_path)

