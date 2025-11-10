#!/bin/bash
# Build script for Render deployment
# This ensures data files are available

set -e

echo "🔨 Building backend for Render..."

# Ensure data directory exists
mkdir -p data
mkdir -p models

# Check if data files exist
if [ ! -f "data/student_data_sample.csv" ]; then
    echo "⚠️  Warning: student_data_sample.csv not found in data directory"
    echo "📝 Creating a minimal sample file..."
    # Create a minimal CSV file if it doesn't exist
    cat > data/student_data_sample.csv << EOF
student_id,course_id,attendance,marks,internal_score,final_exam_score,result,student_name,course_name,dept_id
1,1,85,78,22,65,1,John Doe,Data Structures,1
1,2,90,82,25,70,1,John Doe,Algorithms,1
2,1,75,65,18,55,0,Jane Smith,Data Structures,1
2,3,88,80,23,68,1,Jane Smith,Database Systems,1
3,2,92,88,26,72,1,Bob Johnson,Algorithms,1
3,3,70,60,15,50,0,Bob Johnson,Database Systems,1
4,1,88,82,24,68,1,Alice Brown,Data Structures,1
4,2,75,68,19,58,0,Alice Brown,Algorithms,1
5,1,65,55,12,45,0,Charlie Wilson,Data Structures,1
5,3,90,85,25,70,1,Charlie Wilson,Database Systems,1
EOF
    echo "✅ Created minimal sample file"
else
    echo "✅ Found student_data_sample.csv"
fi

echo "✅ Build complete!"

