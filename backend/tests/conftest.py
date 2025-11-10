"""Shared pytest fixtures for backend tests."""
import os
from typing import Dict

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.ml.train import train_model


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session, trained_model_env):
    """Provide a FastAPI TestClient with database override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def trained_model_env(tmp_path_factory) -> Dict[str, str]:
    """Train a calibrated model once and point environment variables to it."""

    tmp_dir = tmp_path_factory.mktemp("model_artifacts")
    model_path = tmp_dir / "marks_classifier.joblib"
    metadata_path = tmp_dir / "metadata.json"

    rows = []
    for attendance in [35, 45, 55, 65, 75, 85, 95]:
        for marks in [0, 20, 40, 60, 80, 95]:
            internal = max(0, min(100, marks + (attendance - 50) * 0.4))
            result = 1 if marks >= 60 and attendance >= 60 else 0
            rows.append(
                {
                    "attendance": attendance,
                    "marks": marks,
                    "internal_score": internal,
                    "result": result,
                }
            )

    # Explicit implausible negative case
    rows.append({"attendance": 56, "marks": 0, "internal_score": 70, "result": 0})
    rows.append({"attendance": 92, "marks": 88, "internal_score": 84, "result": 1})

    data = pd.DataFrame(rows)
    train_model(data, model_path=str(model_path), metadata_path=str(metadata_path))

    prev_model_path = os.environ.get("MODEL_PATH")
    prev_metadata_path = os.environ.get("MODEL_METADATA_PATH")

    os.environ["MODEL_PATH"] = str(model_path)
    os.environ["MODEL_METADATA_PATH"] = str(metadata_path)

    yield {
        "model_path": str(model_path),
        "metadata_path": str(metadata_path),
    }

    if prev_model_path is not None:
        os.environ["MODEL_PATH"] = prev_model_path
    else:
        os.environ.pop("MODEL_PATH", None)

    if prev_metadata_path is not None:
        os.environ["MODEL_METADATA_PATH"] = prev_metadata_path
    else:
        os.environ.pop("MODEL_METADATA_PATH", None)

