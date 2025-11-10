"""Input validation tests for prediction endpoints."""


def test_predict_out_of_range_attendance_returns_400(client, trained_model_env):
    response = client.post(
        "/api/predict",
        json={
            "attendance": 120,
            "marks": 50,
            "internal_score": 50,
        },
    )

    assert response.status_code == 400
    assert "attendance" in response.json()["detail"].lower()


def test_predict_negative_marks_returns_400(client, trained_model_env):
    response = client.post(
        "/api/predict",
        json={
            "attendance": 80,
            "marks": -5,
            "internal_score": 40,
        },
    )

    assert response.status_code == 400
    assert "marks" in response.json()["detail"].lower()

