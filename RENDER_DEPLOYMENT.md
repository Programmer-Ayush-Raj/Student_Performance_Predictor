# Render Deployment Guide

This guide will help you deploy the Student Performance Predictor backend to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Create a New Web Service on Render

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your repository
4. Render will automatically detect the `render.yaml` configuration

### 2. Configure Environment Variables

In the Render dashboard, set the following environment variables:

- `ADMIN_TOKEN`: Your admin token for API authentication (e.g., `changeme` or a secure token)
- `DATABASE_URL`: `sqlite:///./db.sqlite` (default, or use PostgreSQL if preferred)
- `MODEL_PATH`: `./models/marks_classifier.joblib` (default)
- `MODEL_METADATA_PATH`: `./models/metadata.json` (default)

### 3. Important Notes

- **Data Files**: The `student_data_sample.csv` file is included in the repository and will be copied during deployment
- **Persistent Disk**: The render.yaml includes a persistent disk for storing the database and models
- **Build Process**: The build script (`backend/build.sh`) ensures data files are available

### 4. Verify Deployment

After deployment, check the logs to ensure:
- ✅ The data file is found: `Found student_data_sample.csv at ...`
- ✅ Database is initialized
- ✅ Server starts successfully

### 5. Test the API

Once deployed, test the endpoints:

```bash
# Health check
curl https://your-service.onrender.com/health

# Retrain model (requires ADMIN_TOKEN)
curl -X POST https://your-service.onrender.com/api/retrain \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Troubleshooting

### Issue: CSV file not found

**Solution**: 
- Ensure `backend/data/student_data_sample.csv` exists in your repository
- Check that the file is not in `.gitignore`
- Verify the build logs show the file is being copied

### Issue: Database errors

**Solution**:
- Ensure the persistent disk is properly mounted
- Check that `DATABASE_URL` is correctly set
- Verify disk space is available

### Issue: Model training fails

**Solution**:
- Check that the CSV file has at least 10 rows with valid data
- Verify the CSV format matches the expected schema
- Check the API logs for specific error messages

## File Structure

The deployment expects this structure:

```
backend/
├── app/
│   ├── main.py
│   ├── ml/
│   │   ├── train.py
│   │   └── predictor.py
│   └── ...
├── data/
│   └── student_data_sample.csv  # Required for training
├── scripts/
│   └── import_csv.py
├── build.sh
├── Dockerfile
├── requirements.txt
└── render.yaml
```

## Additional Configuration

### Using PostgreSQL (Recommended for Production)

If you want to use PostgreSQL instead of SQLite:

1. Create a PostgreSQL database on Render
2. Update `DATABASE_URL` to use the PostgreSQL connection string
3. The application will automatically use PostgreSQL

### Custom Domain

1. Go to your service settings
2. Add a custom domain
3. Update CORS settings in `app/main.py` if needed

## Support

For issues specific to Render deployment, check:
- Render documentation: https://render.com/docs
- Application logs in the Render dashboard
- Build logs for deployment issues

