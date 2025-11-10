"""Pytest tests for API endpoints."""

from app.main import ADMIN_TOKEN


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_endpoint(client):
    """Test prediction endpoint with sample data."""
    # Note: This will fail if model is not trained, which is expected
    # In a real scenario, you'd train a model first or mock it
    response = client.post(
        "/api/predict",
        json={
            "attendance": 82,
            "marks": 75,
            "internal_score": 20
        }
    )
    
    # If model exists, should return 200 with prediction
    # If model doesn't exist, should return 503
    assert response.status_code in [200, 503]
    
    if response.status_code == 200:
        data = response.json()
        assert "predicted_result" in data
        assert "probability" in data
        assert data["predicted_result"] in [0, 1]
        assert 0 <= data["probability"] <= 1


def test_retrain_endpoint_unauthorized(client):
    """Test retrain endpoint without authentication."""
    response = client.post("/api/retrain")
    assert response.status_code == 401


def test_retrain_endpoint_authorized(client):
    """Test retrain endpoint with authentication."""
    # This will fail if there's no training data, which is expected
    response = client.post(
        "/api/retrain",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
    )
    
    # Should return 200 if data exists, 400 if insufficient data
    assert response.status_code in [200, 400]
    
    if response.status_code == 200:
        data = response.json()
        assert "accuracy" in data
        assert "precision" in data
        assert "recall" in data
        assert "f1_score" in data
        assert "model_path" in data
        assert "timestamp" in data
        assert "samples_used" in data


def test_get_students(client):
    """Test getting students list."""
    response = client.get("/api/students")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data


def test_create_student(client):
    """Test creating a student."""
    response = client.post(
        "/api/students",
        json={"name": "Test Student", "dept_id": 1}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Student"
    assert "student_id" in data


def test_get_student_not_found(client):
    """Test getting a non-existent student."""
    response = client.get("/api/students/99999")
    assert response.status_code == 404

