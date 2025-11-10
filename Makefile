.PHONY: help install dev backend frontend test docker-up docker-down clean

help:
	@echo "Available commands:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Run both backend and frontend (requires both to be installed)"
	@echo "  make backend     - Run backend only"
	@echo "  make frontend    - Run frontend only"
	@echo "  make test        - Run tests"
	@echo "  make docker-up   - Start services with Docker Compose"
	@echo "  make docker-down - Stop Docker Compose services"
	@echo "  make clean       - Clean up generated files"

install:
	@echo "Installing backend dependencies..."
	cd backend && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting both services..."
	@bash scripts/dev.sh

backend:
	@echo "Starting backend..."
	cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	@echo "Starting frontend..."
	cd frontend && npm run dev

test:
	@echo "Running backend tests..."
	cd backend && source venv/bin/activate && pytest
	@echo "Running frontend tests..."
	cd frontend && npm test

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name ".pytest_cache" -exec rm -r {} +
	rm -rf backend/venv
	rm -rf frontend/node_modules
	rm -rf backend/db.sqlite
	rm -rf backend/models/*.joblib

