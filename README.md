<div align="center">

# 🎓 Student Performance Predictor

**An AI-powered full-stack web application that predicts student performance and provides smart, personalized feedback to help improve learning outcomes.**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Available-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[🌐 Live Demo](https://student-performance-predictor-brown.vercel.app) • [📖 Documentation](#-api-endpoints) • [🚀 Quick Start](#-how-to-run) • [💬 Issues](https://github.com/Programmer-Ayush-Raj/Student_Performance_Predictor/issues)

</div>

---

<p align="center">
  <img src="./assets/banner.png" alt="Student Performance Predictor Banner" width="100%">
</p>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Project Architecture](#️-project-architecture)
- [🚀 Getting Started](#-getting-started)
- [🧮 Machine Learning Model](#-machine-learning-model)
- [📡 API Endpoints](#-api-endpoints)
- [💡 Key Features](#-key-features)
- [🔮 Future Enhancements](#-future-enhancements)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [👨‍💻 Author](#-author)

---

## ✨ Features

- 🎯 **Smart Predictions** - Predict student pass/fail probability using trained ML models
- 📊 **Personalized Feedback** - Get actionable, personalized improvement suggestions
- 🔄 **Dynamic Retraining** - Retrain ML models on-demand with new data
- 👥 **Student Management** - Complete CRUD operations for student data
- 📈 **Batch Predictions** - Predict performance for multiple students at once
- 🎨 **Modern UI** - Beautiful, responsive interface built with React and Tailwind CSS
- 📚 **API Documentation** - Interactive Swagger/OpenAPI documentation
- 🐳 **Docker Support** - Easy deployment with Docker and Docker Compose
- ✅ **Input Validation** - Robust validation with suspicious input detection
- 📉 **Analytics Dashboard** - Visualize predictions and performance metrics

---

## 🛠️ Tech Stack

### 🖥️ Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Recharts** - Beautiful charts and visualizations
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing

### ⚙️ Backend
- **Python 3.10+** - Modern Python features
- **FastAPI** - High-performance web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server

### 🤖 Machine Learning
- **Scikit-learn** - ML algorithms and utilities
- **Logistic Regression** - Classification model
- **Joblib** - Model serialization
- **NumPy & Pandas** - Data manipulation

### 🗄️ Database
- **SQLite** - Default database (development)
- **PostgreSQL/MySQL** - Production-ready alternatives

### 🧩 DevOps & Tools
- **Docker & Docker Compose** - Containerization
- **Pytest** - Testing framework
- **Vitest** - Frontend testing
- **Git** - Version control

---

## 🏗️ Project Architecture

```
Student_Performance_Predictor/
│
├── 📁 backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── database.py          # Database connection & session management
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── crud.py              # Database CRUD operations
│   │   └── ml/
│   │       ├── train.py         # Model training pipeline
│   │       └── predictor.py     # Prediction & feedback generation
│   ├── scripts/
│   │   └── import_csv.py        # CSV data import utility
│   ├── models/                  # Trained ML models storage
│   ├── data/                    # Training data (CSV files)
│   ├── tests/                   # Backend test suite
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend container config
│
├── 📁 frontend/
│   ├── src/
│   │   ├── pages/               # React page components
│   │   │   ├── Predictor.tsx    # Main prediction interface
│   │   │   ├── Students.tsx     # Student management
│   │   │   └── Admin.tsx        # Admin dashboard
│   │   ├── components/          # Reusable UI components
│   │   ├── api.ts              # API client & types
│   │   └── App.tsx             # Main app component
│   ├── public/                 # Static assets
│   ├── package.json            # Node.js dependencies
│   ├── vite.config.ts         # Vite configuration
│   └── Dockerfile              # Frontend container config
│
├── 📁 data/                     # Sample datasets
├── 📁 scripts/                  # Development scripts
├── docker-compose.yml           # Multi-container setup
├── Makefile                     # Build automation
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** installed
- **Node.js 18+** and npm installed
- **Docker & Docker Compose** (optional, for containerized setup)
- **Git** for cloning the repository

### 🔹 Option 1: Docker Setup (Recommended)

The easiest way to get started is using Docker:

```bash
# Clone the repository
git clone https://github.com/Programmer-Ayush-Raj/Student_Performance_Predictor.git
cd Student_Performance_Predictor

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Access the application:**
- 🌐 **Frontend**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📚 **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🔹 Option 2: Manual Setup (Local Development)

#### 🧩 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

#### 💻 Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🧮 Machine Learning Model

### Model Details

| Feature | Description |
|---------|-------------|
| **Algorithm** | Logistic Regression |
| **Library** | scikit-learn |
| **Input Features** | `attendance`, `marks`, `internal_score` |
| **Target Variable** | `result` (1 = pass, 0 = fail) |
| **Training Split** | 80% training, 20% testing |
| **Model Storage** | Joblib format (`.joblib`) |
| **Feature Scaling** | StandardScaler normalization |
| **Threshold** | Configurable (default: 0.6) |

### Model Performance Metrics

The model provides comprehensive metrics including:
- **Accuracy** - Overall prediction accuracy
- **Precision** - True positive rate
- **Recall** - Sensitivity
- **F1-Score** - Harmonic mean of precision and recall
- **ROC-AUC** - Area under the ROC curve
- **Cross-Validation** - K-fold cross-validation scores

### Training the Model

```bash
# Train the model using CSV data
curl -X POST "http://localhost:8000/api/retrain" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check endpoint | ❌ |
| `POST` | `/api/predict` | Predict single student performance | ❌ |
| `POST` | `/api/predict_batch` | Batch prediction for all students | ✅ |
| `POST` | `/api/retrain` | Retrain ML model with new data | ✅ |
| `GET` | `/api/students` | Get paginated student list | ❌ |
| `POST` | `/api/students` | Create new student | ❌ |
| `GET` | `/api/students/{id}` | Get student by ID | ❌ |
| `PUT` | `/api/students/{id}` | Update student | ❌ |
| `DELETE` | `/api/students/{id}` | Delete student | ❌ |
| `POST` | `/api/export` | Export data as CSV | ✅ |
| `GET` | `/api/settings/threshold` | Get prediction threshold | ✅ |
| `POST` | `/api/settings/threshold` | Update prediction threshold | ✅ |

### Example API Request

**Predict Student Performance:**

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance": 82,
    "marks": 75,
    "internal_score": 20,
    "final_exam_score": 70
  }'
```

**Response:**

```json
{
  "predicted_result": 1,
  "probability": 0.85,
  "threshold_used": 0.6,
  "suspicious_input": false,
  "explanation": {
    "top_reasons": [
      {
        "feature": "marks",
        "effect": "increase",
        "contribution": 0.42
      }
    ],
    "feature_importances": {
      "attendance": 0.35,
      "marks": 0.42,
      "internal_score": 0.23
    }
  },
  "feedback": [
    {
      "feature": "internal_score",
      "suggested_change": "Increase internal_score by 10 points (20 → 30)",
      "estimated_probability_gain": 0.12,
      "priority": "high"
    }
  ],
  "feedback_paragraph": "Based on your current inputs..."
}
```

---

## 🧰 Environment Variables

### Backend (`.env`)

Create a `.env` file in the `backend/` directory:

```ini
# Admin authentication
ADMIN_TOKEN=your_secure_admin_token_here

# Database configuration
DATABASE_URL=sqlite:///./db.sqlite
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/dbname

# Model paths
MODEL_PATH=./models/marks_classifier.joblib
MODEL_METADATA_PATH=./models/metadata.json

# Prediction threshold (0.0 to 1.0)
PRED_THRESHOLD=0.6
```

### Frontend (`.env`)

Create a `.env` file in the `frontend/` directory:

```ini
VITE_API_BASE_URL=http://localhost:8000
```

---

## 💡 Key Features

### 🎯 Intelligent Predictions
- Real-time pass/fail probability calculation
- Configurable decision thresholds
- Batch prediction support for multiple students

### 📝 Personalized Feedback
- Actionable improvement suggestions
- Feature-specific recommendations
- Priority-based feedback ranking
- Estimated probability gains for each suggestion

### 🔍 Input Validation
- Range validation for all inputs
- Suspicious input detection
- Data consistency checks
- Clear error messages

### 📊 Analytics & Visualization
- Interactive charts and graphs
- Performance metrics dashboard
- Feature importance visualization
- Prediction history tracking

### 🔐 Security
- Admin token authentication
- CORS configuration
- Input sanitization
- Secure API endpoints

---

## 🔮 Future Enhancements

- [ ] 🧾 PostgreSQL integration for production scalability
- [ ] 📊 SHAP-based model explainability
- [ ] 🔄 Scheduled automatic retraining jobs
- [ ] 📈 Advanced analytics dashboard
- [ ] 🔔 Email notifications for predictions
- [ ] 📱 Mobile-responsive improvements
- [ ] 🌐 Multi-language support
- [ ] 🔍 Advanced filtering and search
- [ ] 📉 Historical trend analysis
- [ ] 👥 User authentication and roles

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute to this project:

1. **Fork the repository** 🍴
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request** 🚀

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write tests for new features
- Update documentation as needed
- Follow conventional commit messages

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Ayush Raj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author

<div align="center">

### ✨ **Ayush Raj**

<p>
  <a href="mailto:rajayush6200@gmail.com">
    <img src="https://img.shields.io/badge/Email-rajayush6200@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
  <a href="https://github.com/Programmer-Ayush-Raj">
    <img src="https://img.shields.io/badge/GitHub-Programmer--Ayush--Raj-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</p>

**📍 VIT Vellore | Data Science | AI & Management Enthusiast**

Passionate about building intelligent systems that make a difference in education and learning outcomes.

</div>

---

<div align="center">

### ⭐ **If you like this project, give it a star!**

Your support motivates continued development 🚀

**Made with ❤️ by [Ayush Raj](https://github.com/Programmer-Ayush-Raj)**

[⬆ Back to Top](#-student-performance-predictor)

</div>
