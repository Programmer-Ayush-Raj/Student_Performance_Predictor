"""
Script to import CSV data into the SQLite database.
"""
import csv
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app import models, crud, schemas


def import_csv_to_db(csv_path: str, db: Session):
    """
    Import CSV data into the database.
    
    Expected CSV columns:
    student_id, course_id, attendance, marks, internal_score, final_exam_score, result
    """
    created_students = set()
    created_courses = set()
    imported_count = 0
    updated_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # Parse student_id and course_id
                student_id = int(row['student_id'])
                course_id = int(row['course_id'])
                
                # Create student if not exists
                if student_id not in created_students:
                    student = crud.get_student(db, student_id)
                    if not student:
                        # Create a default student (name will be "Student {id}" if not in CSV)
                        student_name = row.get('student_name', f'Student {student_id}')
                        dept_id = int(row['dept_id']) if row.get('dept_id') and row.get('dept_id').strip() else None
                        # Create student with explicit ID
                        db_student = models.Student(
                            student_id=student_id,
                            name=student_name,
                            dept_id=dept_id
                        )
                        db.add(db_student)
                        db.flush()  # Flush to get the ID without committing
                    created_students.add(student_id)
                
                # Create course if not exists
                if course_id not in created_courses:
                    course = crud.get_course(db, course_id)
                    if not course:
                        course_name = row.get('course_name', f'Course {course_id}')
                        dept_id = int(row['dept_id']) if row.get('dept_id') and row.get('dept_id').strip() else None
                        # Create course with explicit ID
                        db_course = models.Course(
                            course_id=course_id,
                            course_name=course_name,
                            dept_id=dept_id
                        )
                        db.add(db_course)
                        db.flush()  # Flush to get the ID without committing
                    created_courses.add(course_id)
                
                # Parse enrollment data
                attendance = float(row['attendance']) if row.get('attendance') else None
                marks = float(row['marks']) if row.get('marks') else None
                internal_score = float(row['internal_score']) if row.get('internal_score') else None
                final_exam_score = float(row['final_exam_score']) if row.get('final_exam_score') else None
                result = int(row['result']) if row.get('result') else None
                
                # Check if enrollment exists
                existing_enrollment = (
                    db.query(models.Enrollment)
                    .filter(
                        models.Enrollment.student_id == student_id,
                        models.Enrollment.course_id == course_id
                    )
                    .first()
                )
                
                if existing_enrollment:
                    # Update existing enrollment
                    existing_enrollment.attendance = attendance
                    existing_enrollment.marks = marks
                    existing_enrollment.internal_score = internal_score
                    existing_enrollment.final_exam_score = final_exam_score
                    existing_enrollment.result = result
                    updated_count += 1
                else:
                    # Create new enrollment
                    enrollment = crud.create_enrollment(db, schemas.EnrollmentCreate(
                        student_id=student_id,
                        course_id=course_id,
                        attendance=attendance,
                        marks=marks,
                        internal_score=internal_score,
                        final_exam_score=final_exam_score,
                        result=result
                    ))
                    imported_count += 1
                
            except Exception as e:
                print(f"Error processing row: {row} - {e}")
                continue
    
    db.commit()
    print(f"Import complete: {imported_count} new enrollments, {updated_count} updated enrollments")
    print(f"Created {len(created_students)} students and {len(created_courses)} courses")


def main():
    """Main function to run the import."""
    if len(sys.argv) < 2:
        print("Usage: python import_csv.py <csv_file_path>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found: {csv_path}")
        sys.exit(1)
    
    # Initialize database
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        import_csv_to_db(csv_path, db)
    except Exception as e:
        print(f"Error importing CSV: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

