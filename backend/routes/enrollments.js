const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [enrollments] = await db.query(`
      SELECT e.*, s.FullName as StudentName, c.CourseName 
      FROM Enrollment e
      JOIN Student s ON e.StudentID = s.StudentID
      JOIN Course c ON e.CourseID = c.CourseID
      ORDER BY e.EnrollmentID DESC
    `);
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Error fetching enrollments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { StudentID, CourseID, EnrollmentDate, Grade } = req.body;
    
    if (!StudentID || !CourseID || !EnrollmentDate) {
      return res.status(400).json({ message: 'Student, course, and date are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Enrollment (StudentID, CourseID, EnrollmentDate, Grade) VALUES (?, ?, ?, ?)',
      [StudentID, CourseID, EnrollmentDate, Grade || null]
    );
    
    res.status(201).json({ message: 'Enrollment created successfully', enrollmentId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Student already enrolled in this course' });
    } else {
      console.error('Create enrollment error:', error);
      res.status(500).json({ message: 'Error creating enrollment' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { Grade } = req.body;
    
    const [result] = await db.query(
      'UPDATE Enrollment SET Grade=? WHERE EnrollmentID=?', 
      [Grade || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ message: 'Error updating enrollment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Enrollment WHERE EnrollmentID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ message: 'Error deleting enrollment' });
  }
});

module.exports = router;