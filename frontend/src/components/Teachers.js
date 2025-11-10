import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import './Common.css';

const API_URL = 'http://localhost:5002/api';

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState({
    TeacherID: '',
    FullName: '',
    Email: '',
    PhoneNumber: '',
    DepartmentID: ''
  });

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
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
        await axios.put(`${API_URL}/teachers/${currentTeacher.TeacherID}`, currentTeacher);
        alert('Teacher updated successfully!');
      } else {
        await axios.post(`${API_URL}/teachers`, currentTeacher);
        alert('Teacher created successfully!');
      }
      fetchTeachers();
      closeModal();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert(error.response?.data?.message || 'Error saving teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`${API_URL}/teachers/${id}`);
        alert('Teacher deleted successfully!');
        fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Error deleting teacher');
      }
    }
  };

  const openModal = (teacher = null) => {
    if (teacher) {
      setCurrentTeacher(teacher);
      setEditMode(true);
    } else {
      setCurrentTeacher({
        FullName: '',
        Email: '',
        PhoneNumber: '',
        DepartmentID: ''
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
        <h2>Teachers Management</h2>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Add Teacher
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
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                  No teachers found. Add your first teacher!
                </td>
              </tr>
            ) : (
              teachers.map(teacher => (
                <tr key={teacher.TeacherID}>
                  <td>{teacher.TeacherID}</td>
                  <td>{teacher.FullName}</td>
                  <td>{teacher.Email}</td>
                  <td>{teacher.PhoneNumber || 'N/A'}</td>
                  <td>{teacher.DepartmentName || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openModal(teacher)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(teacher.TeacherID)}>
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
              <h3>{editMode ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={currentTeacher.FullName}
                  onChange={(e) => setCurrentTeacher({...currentTeacher, FullName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={currentTeacher.Email}
                  onChange={(e) => setCurrentTeacher({...currentTeacher, Email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={currentTeacher.PhoneNumber}
                  onChange={(e) => setCurrentTeacher({...currentTeacher, PhoneNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={currentTeacher.DepartmentID}
                  onChange={(e) => setCurrentTeacher({...currentTeacher, DepartmentID: e.target.value})}
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

export default Teachers;
