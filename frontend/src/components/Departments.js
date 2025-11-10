import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X } from 'lucide-react';
import './Common.css';

const API_URL = 'http://localhost:5002/api';

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

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
      await axios.post(`${API_URL}/departments`, {
        DepartmentName: departmentName
      });
      alert('Department created successfully!');
      fetchDepartments();
      closeModal();
    } catch (error) {
      console.error('Error saving department:', error);
      alert(error.response?.data?.message || 'Error saving department');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setDepartmentName('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Departments Management</h2>
        <button className="btn-primary" onClick={openModal}>
          <Plus size={20} />
          Add Department
        </button>
      </div>

      <div className="cards-grid">
        {departments.length === 0 ? (
          <p style={{padding: '20px', textAlign: 'center', width: '100%'}}>
            No departments found. Add your first department!
          </p>
        ) : (
          departments.map(dept => (
            <div key={dept.DepartmentID} className="card">
              <h3>{dept.DepartmentName}</h3>
              <p>ID: {dept.DepartmentID}</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Department</h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
