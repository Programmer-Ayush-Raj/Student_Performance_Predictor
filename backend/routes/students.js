const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all students
router.get('/', async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.*, d.DepartmentName 
      FROM Student s 
      LEFT JOIN Department d ON s.DepartmentID = d.DepartmentID
      ORDER BY s.StudentID DESC
    `);
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const [students] = await db.query(
      'SELECT s.*, d.DepartmentName FROM Student s LEFT JOIN Department d ON s.DepartmentID = d.DepartmentID WHERE s.StudentID = ?', 
      [req.params.id]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(students[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Error fetching student' });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const { FullName, Email, PhoneNumber, DateOfBirth, Gender, Address, DepartmentID } = req.body;
    
    if (!FullName || !Email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Student (FullName, Email, PhoneNumber, DateOfBirth, Gender, Address, DepartmentID) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [FullName, Email, PhoneNumber, DateOfBirth || null, Gender, Address, DepartmentID || null]
    );

    res.status(201).json({ 
      message: 'Student created successfully', 
      studentId: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      console.error('Create student error:', error);
      res.status(500).json({ message: 'Error creating student' });
    }
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { FullName, Email, PhoneNumber, DateOfBirth, Gender, Address, DepartmentID } = req.body;
    
    const [result] = await db.query(
      'UPDATE Student SET FullName=?, Email=?, PhoneNumber=?, DateOfBirth=?, Gender=?, Address=?, DepartmentID=? WHERE StudentID=?',
      [FullName, Email, PhoneNumber, DateOfBirth || null, Gender, Address, DepartmentID || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Error updating student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Student WHERE StudentID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

module.exports = router;