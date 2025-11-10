import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X } from 'lucide-react';
import './Common.css';

const API_URL = 'http://localhost:5002/api';

function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState({
    RoomNumber: '',
    Capacity: '',
    Building: ''
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/classrooms`);
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/classrooms`, currentClassroom);
      alert('Classroom created successfully!');
      fetchClassrooms();
      closeModal();
    } catch (error) {
      console.error('Error saving classroom:', error);
      alert(error.response?.data?.message || 'Error saving classroom');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setCurrentClassroom({
      RoomNumber: '',
      Capacity: '',
      Building: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Classrooms Management</h2>
        <button className="btn-primary" onClick={openModal}>
          <Plus size={20} />
          Add Classroom
        </button>
      </div>

      <div className="cards-grid">
        {classrooms.length === 0 ? (
          <p style={{padding: '20px', textAlign: 'center', width: '100%'}}>
            No classrooms found. Add your first classroom!
          </p>
        ) : (
          classrooms.map(room => (
            <div key={room.RoomNumber} className="card">
              <h3>Room {room.RoomNumber}</h3>
              <p><strong>Building:</strong> {room.Building}</p>
              <p><strong>Capacity:</strong> {room.Capacity} students</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Classroom</h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Room Number *</label>
                <input
                  type="text"
                  value={currentClassroom.RoomNumber}
                  onChange={(e) => setCurrentClassroom({...currentClassroom, RoomNumber: e.target.value})}
                  placeholder="e.g., 101"
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  value={currentClassroom.Capacity}
                  onChange={(e) => setCurrentClassroom({...currentClassroom, Capacity: e.target.value})}
                  placeholder="e.g., 40"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Building *</label>
                <input
                  type="text"
                  value={currentClassroom.Building}
                  onChange={(e) => setCurrentClassroom({...currentClassroom, Building: e.target.value})}
                  placeholder="e.g., Building A"
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

export default Classrooms;