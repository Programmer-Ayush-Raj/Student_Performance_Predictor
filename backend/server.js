const express = require('express');
const cors = require('cors');
const predictRoutes = require('./routes/predict');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/predict', predictRoutes);


// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Student Management API is running!' });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
