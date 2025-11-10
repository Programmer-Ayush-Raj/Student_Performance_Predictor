import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import './Common.css';

const API_URL = 'http://localhost:5002/api';

function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentEnrollment, setCurrentEnrollment] = useState({
    EnrollmentID: '',
    StudentID: '',
    CourseID: '',
    EnrollmentDate: '',
    Grade: ''
  });

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get(`${API_URL}/enrollments`);
      setEnrollments(response.data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode) {
        await axios.put(`${API_URL}/enrollments/${currentEnrollment.EnrollmentID}`, currentEnrollment);
        alert('Enrollment updated successfully!');
      } else {
        await axios.post(`${API_URL}/enrollments`, currentEnrollment);
        alert('Enrollment created successfully!');
      }
      fetchEnrollments();
      closeModal();
    } catch (error) {
      console.error('Error saving enrollment:', error);
      alert(error.response?.data?.message || 'Error saving enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        await axios.delete(`${API_URL}/enrollments/${id}`);
        alert('Enrollment deleted successfully!');
        fetchEnrollments();
      } catch (error) {
        console.error('Error deleting enrollment:', error);
        alert('Error deleting enrollment');
      }
    }
  };

  const openModal = (enrollment = null) => {
    if (enrollment) {
      setCurrentEnrollment({
        ...enrollment,
        EnrollmentDate: enrollment.EnrollmentDate ? enrollment.EnrollmentDate.split('T')[0] : ''
      });
      setEditMode(true);
    } else {
      setCurrentEnrollment({
        StudentID: '',
        CourseID: '',
        EnrollmentDate: new Date().toISOString().split('T')[0],
        Grade: ''
      });
      setEditMode(false);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Enrollments Management</h2>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Add Enrollment
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Course</th>
              <th>Enrollment Date</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                  No enrollments found. Add your first enrollment!
                </td>
              </tr>
            ) : (
              enrollments.map(enrollment => (
                <tr key={enrollment.EnrollmentID}>
                  <td>{enrollment.EnrollmentID}</td>
                  <td>{enrollment.StudentName}</td>
                  <td>{enrollment.CourseName}</td>
                  <td>{new Date(enrollment.EnrollmentDate).toLocaleDateString()}</td>
                  <td>{enrollment.Grade || 'Not Graded'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openModal(enrollment)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(enrollment.EnrollmentID)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editMode ? 'Edit Enrollment' : 'Add Enrollment'}</h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student *</label>
                <select
                  value={currentEnrollment.StudentID}
                  onChange={(e) => setCurrentEnrollment({...currentEnrollment, StudentID: e.target.value})}
                  required
                  disabled={editMode}
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.StudentID} value={student.StudentID}>
                      {student.FullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Course *</label>
                <select
                  value={currentEnrollment.CourseID}
                  onChange={(e) => setCurrentEnrollment({...currentEnrollment, CourseID: e.target.value})}
                  required
                  disabled={editMode}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.CourseID} value={course.CourseID}>
                      {course.CourseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Enrollment Date *</label>
                <input
                  type="date"
                  value={currentEnrollment.EnrollmentDate}
                  onChange={(e) => setCurrentEnrollment({...currentEnrollment, EnrollmentDate: e.target.value})}
                  required
                  disabled={editMode}
                />
              </div>
              <div className="form-group">
                <label>Grade</label>
                <input
                  type="text"
                  value={currentEnrollment.Grade}
                  onChange={(e) => setCurrentEnrollment({...currentEnrollment, Grade: e.target.value})}
                  placeholder="A, B, C, etc."
                  maxLength="2"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Enrollments;