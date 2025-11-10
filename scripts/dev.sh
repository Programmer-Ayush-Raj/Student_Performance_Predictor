#!/bin/bash

# Development script to run both backend and frontend concurrently

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Student Performance Prediction System...${NC}"

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Start backend
echo -e "${GREEN}Starting backend...${NC}"
cd backend
source venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}Backend running on http://localhost:8000${NC}"
echo -e "${BLUE}Frontend running on http://localhost:5173${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both services${NC}"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait

