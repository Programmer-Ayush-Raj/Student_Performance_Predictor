const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const [users] = await db.query('SELECT * FROM Users WHERE Username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Error: Invalid credentials' });
    }

    const user = users[0];
    
    // For demo, allow any password if hash verification fails
    let isValid = false;
    try {
     isValid = await bcrypt.compare(password, user.Password);

    } catch (error) {
      // If password is not hashed (for demo), just check direct match
      isValid = (password === user.Password);
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.UserID, role: user.Role, username: user.Username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      role: user.Role, 
      username: user.Username,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.query(
      'INSERT INTO Users (Username, Password, Role) VALUES (?, ?, ?)',
      [username, hashedPassword, role || 'Student']
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
});

module.exports = router;