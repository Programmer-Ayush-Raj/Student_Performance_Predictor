import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import './Common.css';

const API_URL = 'http://localhost:5002/api';

function Students() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({
    StudentID: '',
    FullName: '',
    Email: '',
    PhoneNumber: '',
    DateOfBirth: '',
    Gender: 'Male',
    Address: '',
    DepartmentID: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error loading students');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode) {
        await axios.put(`${API_URL}/students/${currentStudent.StudentID}`, currentStudent);
        alert('Student updated successfully!');
      } else {
        await axios.post(`${API_URL}/students`, currentStudent);
        alert('Student created successfully!');
      }
      fetchStudents();
      closeModal();
    } catch (error) {
      console.error('Error saving student:', error);
      alert(error.response?.data?.message || 'Error saving student');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`${API_URL}/students/${id}`);
        alert('Student deleted successfully!');
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student');
      }
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setCurrentStudent({
        ...student,
        DateOfBirth: student.DateOfBirth ? student.DateOfBirth.split('T')[0] : ''
      });
      setEditMode(true);
    } else {
      setCurrentStudent({
        FullName: '',
        Email: '',
        PhoneNumber: '',
        DateOfBirth: '',
        Gender: 'Male',
        Address: '',
        DepartmentID: ''
      });
      setEditMode(false);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Students Management</h2>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date of Birth</th>
              <th>Gender</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>
                  No students found. Add your first student!
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.StudentID}>
                  <td>{student.StudentID}</td>
                  <td>{student.FullName}</td>
                  <td>{student.Email}</td>
                  <td>{student.PhoneNumber || 'N/A'}</td>
                  <td>{student.DateOfBirth ? new Date(student.DateOfBirth).toLocaleDateString() : 'N/A'}</td>
                  <td>{student.Gender}</td>
                  <td>{student.DepartmentName || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openModal(student)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(student.StudentID)}>
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
              <h3>{editMode ? 'Edit Student' : 'Add Student'}</h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={currentStudent.FullName}
                  onChange={(e) => setCurrentStudent({...currentStudent, FullName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={currentStudent.Email}
                  onChange={(e) => setCurrentStudent({...currentStudent, Email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={currentStudent.PhoneNumber}
                  onChange={(e) => setCurrentStudent({...currentStudent, PhoneNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={currentStudent.DateOfBirth}
                  onChange={(e) => setCurrentStudent({...currentStudent, DateOfBirth: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={currentStudent.Gender}
                  onChange={(e) => setCurrentStudent({...currentStudent, Gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={currentStudent.Address}
                  onChange={(e) => setCurrentStudent({...currentStudent, Address: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={currentStudent.DepartmentID}
                  onChange={(e) => setCurrentStudent({...currentStudent, DepartmentID: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
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

export default Students;
