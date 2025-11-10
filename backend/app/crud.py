"""
CRUD operations for database models.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from . import models, schemas


# Student CRUD operations
def get_student(db: Session, student_id: int) -> Optional[models.Student]:
    """Get a student by ID."""
    return db.query(models.Student).filter(models.Student.student_id == student_id).first()


def get_students(
    db: Session, skip: int = 0, limit: int = 100
) -> tuple[List[models.Student], int]:
    """Get all students with pagination."""
    total = db.query(func.count(models.Student.student_id)).scalar()
    students = db.query(models.Student).offset(skip).limit(limit).all()
    return students, total


def create_student(db: Session, student: schemas.StudentCreate) -> models.Student:
    """Create a new student."""
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


def update_student(
    db: Session, student_id: int, student_update: schemas.StudentUpdate
) -> Optional[models.Student]:
    """Update a student."""
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    
    update_data = student_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_student, field, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student


def delete_student(db: Session, student_id: int) -> bool:
    """Delete a student."""
    db_student = get_student(db, student_id)
    if not db_student:
        return False
    
    db.delete(db_student)
    db.commit()
    return True


# Course CRUD operations
def get_course(db: Session, course_id: int) -> Optional[models.Course]:
    """Get a course by ID."""
    return db.query(models.Course).filter(models.Course.course_id == course_id).first()


def get_courses(db: Session, skip: int = 0, limit: int = 100) -> List[models.Course]:
    """Get all courses."""
    return db.query(models.Course).offset(skip).limit(limit).all()


def create_course(db: Session, course: schemas.CourseCreate) -> models.Course:
    """Create a new course."""
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


# Enrollment CRUD operations
def get_enrollment(db: Session, enrollment_id: int) -> Optional[models.Enrollment]:
    """Get an enrollment by ID."""
    return db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()


def get_enrollments(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Enrollment]:
    """Get all enrollments."""
    return db.query(models.Enrollment).offset(skip).limit(limit).all()


def get_enrollments_by_student(
    db: Session, student_id: int
) -> List[models.Enrollment]:
    """Get all enrollments for a specific student."""
    return db.query(models.Enrollment).filter(models.Enrollment.student_id == student_id).all()


def create_enrollment(
    db: Session, enrollment: schemas.EnrollmentCreate
) -> models.Enrollment:
    """Create a new enrollment."""
    db_enrollment = models.Enrollment(**enrollment.dict())
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


def update_enrollment(
    db: Session, enrollment_id: int, enrollment_update: schemas.EnrollmentUpdate
) -> Optional[models.Enrollment]:
    """Update an enrollment."""
    db_enrollment = get_enrollment(db, enrollment_id)
    if not db_enrollment:
        return None
    
    update_data = enrollment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_enrollment, field, value)
    
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


def get_training_data(db: Session) -> List[models.Enrollment]:
    """
    Get all enrollments with complete data for training.
    Filters out rows with missing required fields.
    """
    return (
        db.query(models.Enrollment)
        .filter(
            models.Enrollment.attendance.isnot(None),
            models.Enrollment.marks.isnot(None),
            models.Enrollment.internal_score.isnot(None),
            models.Enrollment.result.isnot(None),
        )
        .all()
    )


def get_all_enrollments_for_batch_prediction(db: Session) -> List[models.Enrollment]:
    """Get all enrollments for batch prediction."""
    return db.query(models.Enrollment).all()

