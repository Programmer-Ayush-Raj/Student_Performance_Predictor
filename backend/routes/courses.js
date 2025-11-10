const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const [courses] = await db.query(`
      SELECT c.*, d.DepartmentName, t.FullName as TeacherName, cl.Building
      FROM Course c
      LEFT JOIN Department d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN Teacher t ON c.TeacherID = t.TeacherID
      LEFT JOIN Classroom cl ON c.RoomNumber = cl.RoomNumber
      ORDER BY c.CourseID DESC
    `);
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Create course
router.post('/', async (req, res) => {
  try {
    const { CourseName, DepartmentID, Credits, TeacherID, RoomNumber } = req.body;
    
    if (!CourseName || !Credits) {
      return res.status(400).json({ message: 'Course name and credits are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Course (CourseName, DepartmentID, Credits, TeacherID, RoomNumber) VALUES (?, ?, ?, ?, ?)',
      [CourseName, DepartmentID || null, Credits, TeacherID || null, RoomNumber || null]
    );

    res.status(201).json({ message: 'Course created successfully', courseId: result.insertId });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Error creating course' });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const { CourseName, DepartmentID, Credits, TeacherID, RoomNumber } = req.body;
    
    const [result] = await db.query(
      'UPDATE Course SET CourseName=?, DepartmentID=?, Credits=?, TeacherID=?, RoomNumber=? WHERE CourseID=?',
      [CourseName, DepartmentID || null, Credits, TeacherID || null, RoomNumber || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Error updating course' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Course WHERE CourseID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

module.exports = router;