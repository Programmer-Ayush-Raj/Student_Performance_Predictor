const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [departments] = await db.query('SELECT * FROM Department ORDER BY DepartmentID');
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Error fetching departments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { DepartmentName } = req.body;
    
    if (!DepartmentName) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO Department (DepartmentName) VALUES (?)', 
      [DepartmentName]
    );
    
    res.status(201).json({ message: 'Department created successfully', departmentId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Department name already exists' });
    } else {
      console.error('Create department error:', error);
      res.status(500).json({ message: 'Error creating department' });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Department WHERE DepartmentID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Error deleting department' });
  }
});

module.exports = router;
