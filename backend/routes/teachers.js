const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [teachers] = await db.query(`
      SELECT t.*, d.DepartmentName 
      FROM Teacher t 
      LEFT JOIN Department d ON t.DepartmentID = d.DepartmentID
      ORDER BY t.TeacherID DESC
    `);
    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Error fetching teachers' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { FullName, Email, PhoneNumber, DepartmentID } = req.body;
    
    if (!FullName || !Email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Teacher (FullName, Email, PhoneNumber, DepartmentID) VALUES (?, ?, ?, ?)',
      [FullName, Email, PhoneNumber, DepartmentID || null]
    );
    
    res.status(201).json({ message: 'Teacher created successfully', teacherId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      console.error('Create teacher error:', error);
      res.status(500).json({ message: 'Error creating teacher' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { FullName, Email, PhoneNumber, DepartmentID } = req.body;
    
    const [result] = await db.query(
      'UPDATE Teacher SET FullName=?, Email=?, PhoneNumber=?, DepartmentID=? WHERE TeacherID=?',
      [FullName, Email, PhoneNumber, DepartmentID || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher updated successfully' });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Error updating teacher' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Teacher WHERE TeacherID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Error deleting teacher' });
  }
});

module.exports = router;