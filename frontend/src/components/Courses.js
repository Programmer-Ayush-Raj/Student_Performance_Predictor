import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import './Common.css';

const API_URL = 'http://localhost:5002/api';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    CourseID: '',
    CourseName: '',
    DepartmentID: '',
    Credits: '',
    TeacherID: '',
    RoomNumber: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
    fetchTeachers();
    fetchClassrooms();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/classrooms`);
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode) {
        await axios.put(`${API_URL}/courses/${currentCourse.CourseID}`, currentCourse);
        alert('Course updated successfully!');
      } else {
        await axios.post(`${API_URL}/courses`, currentCourse);
        alert('Course created successfully!');
      }
      fetchCourses();
      closeModal();
    } catch (error) {
      console.error('Error saving course:', error);
      alert(error.response?.data?.message || 'Error saving course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`${API_URL}/courses/${id}`);
        alert('Course deleted successfully!');
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
      }
    }
  };

  const openModal = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setEditMode(true);
    } else {
      setCurrentCourse({
        CourseName: '',
        DepartmentID: '',
        Credits: '',
        TeacherID: '',
        RoomNumber: ''
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
        <h2>Courses Management</h2>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Add Course
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Course Name</th>
              <th>Department</th>
              <th>Credits</th>
              <th>Teacher</th>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                  No courses found. Add your first course!
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.CourseID}>
                  <td>{course.CourseID}</td>
                  <td>{course.CourseName}</td>
                  <td>{course.DepartmentName || 'N/A'}</td>
                  <td>{course.Credits}</td>
                  <td>{course.TeacherName || 'N/A'}</td>
                  <td>{course.RoomNumber || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openModal(course)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(course.CourseID)}>
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
              <h3>{editMode ? 'Edit Course' : 'Add Course'}</h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={currentCourse.CourseName}
                  onChange={(e) => setCurrentCourse({...currentCourse, CourseName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={currentCourse.DepartmentID}
                  onChange={(e) => setCurrentCourse({...currentCourse, DepartmentID: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Credits *</label>
                <input
                  type="number"
                  value={currentCourse.Credits}
                  onChange={(e) => setCurrentCourse({...currentCourse, Credits: e.target.value})}
                  min="1"
                  max="6"
                  required
                />
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select
                  value={currentCourse.TeacherID}
                  onChange={(e) => setCurrentCourse({...currentCourse, TeacherID: e.target.value})}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.TeacherID} value={teacher.TeacherID}>
                      {teacher.FullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Classroom</label>
                <select
                  value={currentCourse.RoomNumber}
                  onChange={(e) => setCurrentCourse({...currentCourse, RoomNumber: e.target.value})}
                >
                  <option value="">Select Classroom</option>
                  {classrooms.map(room => (
                    <option key={room.RoomNumber} value={room.RoomNumber}>
                      {room.RoomNumber} - {room.Building}
                    </option>
                  ))}
                </select>
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

export default Courses;