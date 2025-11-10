const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [classrooms] = await db.query('SELECT * FROM Classroom ORDER BY RoomNumber');
    res.json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: 'Error fetching classrooms' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { RoomNumber, Capacity, Building } = req.body;
    
    if (!RoomNumber || !Capacity || !Building) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await db.query(
      'INSERT INTO Classroom (RoomNumber, Capacity, Building) VALUES (?, ?, ?)', 
      [RoomNumber, Capacity, Building]
    );
    
    res.status(201).json({ message: 'Classroom created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Room number already exists' });
    } else {
      console.error('Create classroom error:', error);
      res.status(500).json({ message: 'Error creating classroom' });
    }
  }
});

router.delete('/:roomNumber', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Classroom WHERE RoomNumber = ?', [req.params.roomNumber]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ message: 'Error deleting classroom' });
  }
});

module.exports = router;