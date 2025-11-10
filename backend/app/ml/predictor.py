"""Prediction utilities for the Student Performance model."""
from __future__ import annotations

import json
import logging
import os
from typing import Dict, List, Optional

import joblib
import numpy as np

from .train import FEATURES, MODEL_PATH_DEFAULT, METADATA_PATH_DEFAULT

logger = logging.getLogger(__name__)

BOUNDS: Dict[str, Dict[str, float]] = {
    "attendance": {"min": 0.0, "max": 100.0},
    "marks": {"min": 0.0, "max": 100.0},
    "internal_score": {"min": 0.0, "max": 100.0},
    "final_exam_score": {"min": 0.0, "max": 100.0},
}


class InvalidInputError(ValueError):
    """Raised when incoming features fail validation."""


class Predictor:
    """Predictor class for loading and using trained models with safeguards."""

    def __init__(
        self,
        model_path: str = MODEL_PATH_DEFAULT,
        metadata_path: str = METADATA_PATH_DEFAULT,
    ) -> None:
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model = None
        self.metadata: Dict[str, object] = {}
        self.threshold = 0.6
        self._load_model_and_metadata()

    # ------------------------------------------------------------------
    # Loading utilities
    # ------------------------------------------------------------------
    def _load_model_and_metadata(self) -> None:
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. Please train the model first using /api/retrain"
            )

        try:
            self.model = joblib.load(self.model_path)
        except Exception as exc:  # pragma: no cover - critical failure
            logger.error("Error loading model: %s", exc)
            raise

        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r", encoding="utf-8") as fp:
                self.metadata = json.load(fp)
        else:
            logger.warning("Metadata file missing at %s", self.metadata_path)
            self.metadata = {}

        self.threshold = self._resolve_threshold()
        logger.info(
            "Model and metadata loaded (threshold=%s) from %s",
            self.threshold,
            self.model_path,
        )

    def _resolve_threshold(self) -> float:
        env_threshold = os.getenv("PRED_THRESHOLD")
        if env_threshold:
            try:
                threshold = float(env_threshold)
                if 0.0 < threshold < 1.0:
                    return threshold
                logger.warning("PRED_THRESHOLD out of range (0,1): %s", env_threshold)
            except ValueError:
                logger.warning("Invalid PRED_THRESHOLD value: %s", env_threshold)

        user_defined = self.metadata.get("user_threshold") if isinstance(self.metadata, dict) else None
        if isinstance(user_defined, (float, int)) and 0.0 < float(user_defined) < 1.0:
            return float(user_defined)

        recommended = self.metadata.get("recommended_threshold") if isinstance(self.metadata, dict) else None
        if isinstance(recommended, (float, int)) and 0.0 < float(recommended) < 1.0:
            return float(recommended)

        return 0.6

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _validate_range(name: str, value: Optional[float]) -> float:
        if value is None:
            raise InvalidInputError(f"'{name}' is required")

        try:
            numeric_value = float(value)
        except (TypeError, ValueError) as exc:
            raise InvalidInputError(f"'{name}' must be a number") from exc

        bounds = BOUNDS[name]
        if not (bounds["min"] <= numeric_value <= bounds["max"]):
            raise InvalidInputError(
                f"'{name}' must be between {bounds['min']} and {bounds['max']} (received {numeric_value})"
            )

        return numeric_value

    @staticmethod
    def _collect_suspicion_markers(features: Dict[str, float], final_exam_score: Optional[float]) -> List[str]:
        notes: List[str] = []

        if features["marks"] == 0 and features["internal_score"] >= 60:
            notes.append("Marks are zero while internal score is high; please verify scores.")

        if features["attendance"] < 40 and features["marks"] >= 80:
            notes.append("Attendance is very low compared to high marks. Double-check attendance entry.")

        if final_exam_score is not None and final_exam_score < 20 and features["marks"] >= 70:
            notes.append("Final exam score is low despite high overall marks; confirm final exam data.")

        return notes

    # ------------------------------------------------------------------
    # Explanation helpers
    # ------------------------------------------------------------------
    def _standardize(self, raw_features: np.ndarray) -> np.ndarray:
        scaler = self.metadata.get("scaler", {}) if isinstance(self.metadata, dict) else {}
        mean = np.array(scaler.get("mean", [0.0, 0.0, 0.0]))
        scale = np.array(scaler.get("scale", [1.0, 1.0, 1.0]))
        scale = np.where(scale == 0, 1.0, scale)
        return (raw_features - mean) / scale

    def _build_explanation(self, raw_vector: np.ndarray) -> Dict[str, object]:
        coefficients = self.metadata.get("coefficients", {}) if isinstance(self.metadata, dict) else {}
        permutation_importance = (
            self.metadata.get("permutation_importance") if isinstance(self.metadata, dict) else None
        )

        standardized = self._standardize(raw_vector)
        contributions = {}
        for idx, feature in enumerate(FEATURES):
            weight = float(coefficients.get(feature, 0.0))
            contributions[feature] = float(standardized[idx] * weight)

        top_reasons = self._derive_top_reasons(contributions)
        feature_importances = permutation_importance or {
            feature: float(abs(contributions.get(feature, 0.0))) for feature in FEATURES
        }

        return {
            "top_reasons": top_reasons,
            "feature_importances": feature_importances,
            "coefficients": coefficients,
        }

    # ------------------------------------------------------------------
    # Feedback generation
    # ------------------------------------------------------------------
    def _sigmoid(self, z: float) -> float:
        return float(1.0 / (1.0 + np.exp(-z)))

    def _logit(self, p: float) -> float:
        eps = 1e-6
        p = min(max(p, eps), 1 - eps)
        return float(np.log(p / (1 - p)))

    def _feature_tip(self, feature: str) -> str:
        tips = {
            "marks": "Practice previous year papers, focus on weak chapters, get 1-on-1 tutoring.",
            "attendance": "Attend more lectures and labs, attend office hours, increase attendance by up to +10%.",
            "internal_score": "Submit all assignments, improve assignment quality, discuss rubrics with teacher, up to +10 points.",
        }
        return tips.get(feature, "Focus improvement efforts on this area.")

    def _build_feedback_paragraph(
        self,
        features: Dict[str, float],
        proba: float,
        passed: bool,
        suggestions: List[Dict[str, object]],
        suspicion_notes: List[str],
    ) -> str:
        parts: List[str] = []
        status = "pass" if passed else "fail"
        opening = (
            f"Based on your current inputs, you are predicted to {status} with an estimated probability of {proba*100:.1f}%. "
        )
        if passed:
            opening += (
                "This is a strong position; to increase robustness further, focus on one or two targeted improvements. "
            )
        else:
            opening += (
                "You’re close to your goal—small, focused changes can meaningfully raise your chances. "
            )
        parts.append(opening)

        # Tailor advice by feature levels
        if features["attendance"] < 60:
            parts.append(
                "Your attendance is lower than ideal. Prioritize attending lectures and labs consistently, "
                "use office hours when stuck, and plan a weekly schedule that reduces missed sessions. "
            )
        if features["marks"] < 60:
            parts.append(
                "Your current marks indicate room for improvement. Practice past papers, focus on weaker topics first, "
                "and consider short, regular tutoring or peer study to build speed and accuracy. "
            )
        if features["internal_score"] < 60:
            parts.append(
                "Internal scores matter: submit all assignments on time, align your work with the rubric, and request feedback early to iterate. "
            )

        if suggestions:
            top = suggestions[0]
            parts.append(
                f"A practical next step: {top['suggested_change'].lower()}. This is estimated to increase your pass probability by "
                f"{float(top['estimated_probability_gain'])*100:.1f}% (to about {float(top['new_probability_estimate'])*100:.1f}%). "
            )

        if suspicion_notes:
            parts.append(
                "Note: some inputs look unusual—please double-check data entry to ensure the advice fits your situation. "
            )

        parts.append(
            "Stick to small, consistent improvements each week; track progress and reassess. If you need structure, combine a fixed study routine (e.g., 30–45 minutes daily) with targeted practice and timely assignment submissions."
        )

        return "".join(parts)

    def _compute_feedback(self, raw_vector: np.ndarray, base_prob: float) -> List[Dict[str, object]]:
        coefficients = self.metadata.get("coefficients", {}) if isinstance(self.metadata, dict) else {}
        scaler = self.metadata.get("scaler", {}) if isinstance(self.metadata, dict) else {}
        scales = np.array(scaler.get("scale", [1.0, 1.0, 1.0]), dtype=float)

        # Max suggested increases per feature (caps)
        max_increase = {
            "attendance": 10.0,
            "marks": 15.0,
            "internal_score": 10.0,
        }

        base_logit = self._logit(base_prob)
        suggestions: List[Dict[str, object]] = []

        for idx, feature in enumerate(FEATURES):
            current_value = float(raw_vector[idx])
            cap = max_increase[feature]
            delta_value = min(cap, 100.0 - current_value)
            if delta_value <= 0:
                continue

            coef = float(coefficients.get(feature, 0.0))
            scale = float(scales[idx]) if scales is not None and len(scales) > idx else 1.0
            delta_scaled = delta_value / (scale if scale != 0 else 1.0)
            delta_log_odds = coef * delta_scaled

            new_prob = self._sigmoid(base_logit + delta_log_odds)
            gain = max(0.0, new_prob - base_prob)

            if gain < 0.005:  # too small to be helpful
                priority = "low"
            elif gain < 0.10:
                priority = "medium"
            else:
                priority = "high"

            # Human-friendly suggestion string
            unit = "%" if feature == "attendance" else "points"
            suggested_change = f"Increase {feature} by {int(round(delta_value))} {unit} ({int(round(current_value))} → {int(round(current_value + delta_value))})"

            suggestions.append({
                "feature": feature,
                "current_value": current_value,
                "suggested_change": suggested_change,
                "estimated_probability_gain": float(gain),
                "new_probability_estimate": float(new_prob),
                "priority": priority,
                "explanation": self._feature_tip(feature),
            })

        # Sort by priority then by gain desc
        priority_rank = {"high": 0, "medium": 1, "low": 2}
        suggestions.sort(key=lambda s: (priority_rank.get(s["priority"], 3), -s["estimated_probability_gain"]))
        return suggestions

    @staticmethod
    def _derive_top_reasons(contributions: Dict[str, float]) -> List[Dict[str, object]]:
        ranked = sorted(
            contributions.items(),
            key=lambda item: abs(item[1]),
            reverse=True,
        )

        top = []
        for feature, value in ranked[:3]:
            effect = "increase" if value > 0 else "decrease" if value < 0 else "neutral"
            top.append(
                {
                    "feature": feature,
                    "effect": effect,
                    "contribution": float(value),
                }
            )
        return top

    # ------------------------------------------------------------------
    # Public APIs
    # ------------------------------------------------------------------
    def predict(
        self,
        attendance: float,
        marks: float,
        internal_score: float,
        final_exam_score: Optional[float] = None,
    ) -> Dict[str, object]:
        if self.model is None:
            self._load_model_and_metadata()

        features = {
            "attendance": self._validate_range("attendance", attendance),
            "marks": self._validate_range("marks", marks),
            "internal_score": self._validate_range("internal_score", internal_score),
        }

        if final_exam_score is not None:
            self._validate_range("final_exam_score", final_exam_score)

        suspicion_notes = self._collect_suspicion_markers(features, final_exam_score)
        raw_vector = np.array([features[feat] for feat in FEATURES], dtype=float)

        proba = float(self.model.predict_proba(raw_vector.reshape(1, -1))[0][1])
        prediction = int(proba >= self.threshold)

        explanation = self._build_explanation(raw_vector)
        feedback = self._compute_feedback(raw_vector, proba)
        feedback_paragraph = self._build_feedback_paragraph(features, proba, bool(prediction), feedback, suspicion_notes)

        response = {
            "predicted_result": prediction,
            "probability": proba,
            "threshold_used": float(self.threshold),
            "suspicious_input": bool(suspicion_notes),
            "explanation": explanation,
            "feedback": feedback,
            "feedback_paragraph": feedback_paragraph,
        }

        if suspicion_notes:
            response["suspicious_reasons"] = suspicion_notes
            response["notes"] = "Inputs inconsistent: please verify values (e.g., zero marks with high internal score)."

        if final_exam_score is not None:
            response["final_exam_score"] = float(final_exam_score)

        return response

    def predict_batch(self, data: List[Dict[str, object]]) -> List[Dict[str, object]]:
        if self.model is None:
            self._load_model_and_metadata()

        features_matrix = []
        processed_inputs: List[Dict[str, object]] = []
        for item in data:
            try:
                features = {
                    "attendance": self._validate_range("attendance", item.get("attendance")),
                    "marks": self._validate_range("marks", item.get("marks")),
                    "internal_score": self._validate_range("internal_score", item.get("internal_score")),
                }
            except InvalidInputError as exc:
                raise InvalidInputError(f"Invalid batch item {item}: {exc}") from exc

            final_exam_score = item.get("final_exam_score")
            if final_exam_score is not None:
                self._validate_range("final_exam_score", final_exam_score)

            suspicion_notes = self._collect_suspicion_markers(features, final_exam_score)
            features_matrix.append([features[feat] for feat in FEATURES])
            processed_inputs.append({"meta": item, "features": features, "notes": suspicion_notes})

        predictions = self.model.predict_proba(np.array(features_matrix))[:, 1]

        results = []
        for idx, processed in enumerate(processed_inputs):
            proba = float(predictions[idx])
            label = int(proba >= self.threshold)
            raw_vector = np.array([processed["features"][feat] for feat in FEATURES])
            explanation = self._build_explanation(raw_vector)

            result = {
                "student_id": processed["meta"].get("student_id"),
                "course_id": processed["meta"].get("course_id"),
                "predicted_result": label,
                "probability": proba,
                "threshold_used": float(self.threshold),
                "suspicious_input": bool(processed["notes"]),
                "explanation": explanation,
            }

            if processed["notes"]:
                result["suspicious_reasons"] = processed["notes"]

            results.append(result)

        return results

