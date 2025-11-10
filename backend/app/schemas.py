"""Pydantic schemas for request/response validation."""
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class FeedbackSuggestion(BaseModel):
    feature: str
    current_value: float
    suggested_change: str
    estimated_probability_gain: float = Field(..., ge=0, le=1)
    new_probability_estimate: float = Field(..., ge=0, le=1)
    priority: str
    explanation: str


class ExplanationReason(BaseModel):
    feature: str
    effect: str
    contribution: float


class ExplanationDetail(BaseModel):
    top_reasons: List[ExplanationReason]
    feature_importances: Dict[str, float]
    coefficients: Dict[str, float]


class StudentBase(BaseModel):
    """Base schema for student data."""
    name: str = Field(..., min_length=1, max_length=200)
    dept_id: Optional[int] = None


class StudentCreate(StudentBase):
    """Schema for creating a new student."""
    pass


class StudentUpdate(BaseModel):
    """Schema for updating a student."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    dept_id: Optional[int] = None


class StudentResponse(StudentBase):
    """Schema for student response."""
    student_id: int

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    """Base schema for course data."""
    course_name: str = Field(..., min_length=1, max_length=200)
    dept_id: Optional[int] = None


class CourseCreate(CourseBase):
    """Schema for creating a new course."""
    pass


class CourseResponse(CourseBase):
    """Schema for course response."""
    course_id: int

    class Config:
        from_attributes = True


class EnrollmentBase(BaseModel):
    """Base schema for enrollment data."""
    student_id: int
    course_id: int
    marks: Optional[float] = Field(None, ge=0, le=100)
    attendance: Optional[float] = Field(None, ge=0, le=100)
    internal_score: Optional[float] = Field(None, ge=0, le=100)
    final_exam_score: Optional[float] = Field(None, ge=0, le=100)
    result: Optional[int] = Field(None, ge=0, le=1)


class EnrollmentCreate(EnrollmentBase):
    """Schema for creating a new enrollment."""
    pass


class EnrollmentUpdate(BaseModel):
    """Schema for updating an enrollment."""
    marks: Optional[float] = Field(None, ge=0, le=100)
    attendance: Optional[float] = Field(None, ge=0, le=100)
    internal_score: Optional[float] = Field(None, ge=0, le=100)
    final_exam_score: Optional[float] = Field(None, ge=0, le=100)
    result: Optional[int] = Field(None, ge=0, le=1)


class EnrollmentResponse(EnrollmentBase):
    """Schema for enrollment response."""
    id: int

    class Config:
        from_attributes = True


class PredictRequest(BaseModel):
    """Schema for prediction request."""
    student_id: Optional[int] = None
    course_id: Optional[int] = None
    attendance: float = Field(..., description="Attendance percentage (0-100)")
    marks: float = Field(..., description="Overall marks (0-100)")
    internal_score: float = Field(..., description="Internal score (0-100)")
    final_exam_score: Optional[float] = Field(None, description="Final exam score (0-100), optional")


class PredictResponse(BaseModel):
    """Schema for prediction response."""

    predicted_result: int = Field(..., ge=0, le=1, description="Predicted result: 1 for pass, 0 for fail")
    probability: float = Field(..., ge=0, le=1, description="Probability of passing (0-1)")
    threshold_used: float = Field(..., ge=0, le=1, description="Decision threshold applied")
    suspicious_input: bool = Field(..., description="Indicates flagged inconsistent inputs")
    suspicious_reasons: Optional[List[str]] = Field(None, description="Human-readable warnings about suspicious inputs")
    explanation: ExplanationDetail
    final_exam_score: Optional[float] = Field(None, ge=0, le=100)
    feedback: Optional[List[FeedbackSuggestion]] = None
    notes: Optional[str] = None
    feedback_paragraph: Optional[str] = None


class PredictBatchResponse(BaseModel):
    """Schema for batch prediction response item."""

    student_id: Optional[int]
    course_id: Optional[int]
    predicted_result: int
    probability: float
    threshold_used: float
    suspicious_input: bool
    suspicious_reasons: Optional[List[str]] = None
    explanation: ExplanationDetail


class PredictBatchResponseList(BaseModel):
    """Schema for batch prediction response."""
    predictions: List[PredictBatchResponse]
    total: int


class RetrainResponse(BaseModel):
    """Schema for retrain response."""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    model_path: str
    metadata_path: str
    timestamp: str
    samples_used: int
    class_distribution: Dict[int, float]
    class_counts: Dict[int, int]
    recommended_threshold: float
    metrics_cv: Dict[str, float]
    user_threshold: Optional[float] = None


class UpdateThresholdRequest(BaseModel):
    threshold: float = Field(..., gt=0, lt=1)


class UpdateThresholdResponse(BaseModel):
    threshold: float
    source: str = Field(..., description="Where the threshold is stored")


class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str


class PaginatedStudents(BaseModel):
    """Schema for paginated students response."""
    items: List[StudentResponse]
    total: int
    page: int
    limit: int
    pages: int

