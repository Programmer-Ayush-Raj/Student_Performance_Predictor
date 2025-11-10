"""
SQLAlchemy ORM models for the database schema.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Student(Base):
    """
    Student model representing a student in the system.
    """
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    dept_id = Column(Integer, nullable=True)

    # Relationships
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")


class Course(Base):
    """
    Course model representing a course in the system.
    """
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, nullable=False, index=True)
    dept_id = Column(Integer, nullable=True)

    # Relationships
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")


class Enrollment(Base):
    """
    Enrollment model representing a student's enrollment in a course.
    Contains performance metrics used for ML prediction.
    """
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False, index=True)
    
    # Performance metrics
    marks = Column(Float, nullable=True)  # Overall marks (0-100)
    attendance = Column(Float, nullable=True)  # Attendance percentage (0-100)
    internal_score = Column(Float, nullable=True)  # Internal assessment score (0-100)
    final_exam_score = Column(Float, nullable=True)  # Final exam score (0-100)
    
    # Target variable for ML (1 = pass, 0 = fail)
    result = Column(Integer, nullable=True)  # 1 for pass, 0 for fail

    # Relationships
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

