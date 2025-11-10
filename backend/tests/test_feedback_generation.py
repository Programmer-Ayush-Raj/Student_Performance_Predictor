"""Tests for feedback generation in predict endpoint."""

from fastapi.testclient import TestClient
from app.main import app


def test_predict_returns_feedback_with_plausible_suggestions(client, trained_model_env):
    payload = {"attendance": 56, "marks": 0, "internal_score": 70}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "feedback" in data
    assert isinstance(data["feedback"], list)
    assert len(data["feedback"]) > 0

    # Expect a marks suggestion with meaningful priority
    marks_items = [s for s in data["feedback"] if s.get("feature") == "marks"]
    assert marks_items, "Expected a suggestion for 'marks'"
    assert marks_items[0]["priority"] in ["high", "medium", "low"]

    # Plausibility checks
    for s in data["feedback"]:
        assert 0 <= s["estimated_probability_gain"] <= 0.5
        assert 0 <= s["new_probability_estimate"] <= 1


def test_predict_pass_still_returns_feedback(client, trained_model_env):
    payload = {"attendance": 90, "marks": 85, "internal_score": 80}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_result"] in [0, 1]
    assert "feedback" in data
    assert isinstance(data["feedback"], list)

