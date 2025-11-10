# Project Tree

```
DBMS-main/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application & routes
│   │   ├── database.py                # Database configuration & session
│   │   ├── models.py                  # SQLAlchemy ORM models
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   ├── crud.py                    # CRUD operations
│   │   └── ml/
│   │       ├── __init__.py
│   │       ├── train.py               # ML training pipeline
│   │       └── predictor.py           # ML prediction pipeline
│   ├── scripts/
│   │   └── import_csv.py              # CSV import script
│   ├── tests/
│   │   └── test_api.py                # Pytest tests
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend Docker image
│   └── .env.example                   # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Predictor.tsx         # Prediction page
│   │   │   ├── Students.tsx           # Students management page
│   │   │   └── Admin.tsx               # Admin panel
│   │   ├── __tests__/
│   │   │   ├── setup.ts               # Test setup
│   │   │   └── Predictor.test.tsx     # Frontend tests
│   │   ├── api.ts                     # API client (Axios)
│   │   ├── App.tsx                    # Main app component with routing
│   │   ├── main.tsx                   # React entry point
│   │   ├── index.css                  # Tailwind CSS imports
│   │   └── vite-env.d.ts              # TypeScript env types
│   ├── public/
│   │   └── index.html                 # HTML template
│   ├── package.json                   # Node.js dependencies
│   ├── vite.config.ts                 # Vite configuration
│   ├── tsconfig.json                  # TypeScript config
│   ├── tsconfig.node.json             # TypeScript node config
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── postcss.config.js              # PostCSS config
│   ├── vitest.config.ts               # Vitest test config
│   └── Dockerfile                     # Frontend Docker image
│
├── data/
│   └── student_data_sample.csv        # Sample training data (25 rows)
│
├── scripts/
│   ├── dev.sh                         # Linux/macOS dev script
│   └── dev.ps1                        # Windows PowerShell dev script
│
├── docker-compose.yml                 # Docker Compose configuration
├── Makefile                           # Make commands for common tasks
├── README.md                          # Comprehensive documentation
└── PROJECT_TREE.md                    # This file

```

## File Count Summary

- **Backend Python files**: 9
- **Frontend TypeScript/React files**: 8
- **Configuration files**: 10
- **Scripts**: 2
- **Documentation**: 2
- **Docker files**: 3
- **Test files**: 2
- **Data files**: 1

**Total**: ~35 files

