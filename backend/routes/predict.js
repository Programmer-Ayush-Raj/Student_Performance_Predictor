const express = require('express');
const router = express.Router();

// POST /api/predict
router.post('/', (req, res) => {
  const { attendance, marks, internal_score, final_exam_score } = req.body;

  // Just a mock logic for now
  const probability = (parseFloat(attendance) * 0.3 + parseFloat(marks) * 0.4 + parseFloat(internal_score) * 0.3) / 100;
  const threshold = 0.5;
  const predicted_result = probability >= threshold ? 1 : 0;

  res.json({
    probability,
    threshold_used: threshold,
    predicted_result,
    explanation: {
      top_reasons: [
        { feature: 'Attendance', effect: 'increase', contribution: 0.3 },
        { feature: 'Marks', effect: 'increase', contribution: 0.4 },
        { feature: 'Internal Score', effect: 'increase', contribution: 0.3 },
      ],
      feature_importances: {
        attendance: 0.3,
        marks: 0.4,
        internal_score: 0.3,
        final_exam_score: 0.0,
      },
    },
    feedback: [
      {
        feature: 'Attendance',
        suggested_change: 'Increase to at least 80%',
        explanation: 'Higher attendance improves engagement and understanding.',
        estimated_probability_gain: 0.12,
        new_probability_estimate: Math.min(probability + 0.12, 1.0),
      },
    ],
    feedback_paragraph: 'Improving attendance and marks will increase your chance of passing.',
    suspicious_input: false,
  });
});

module.exports = router;
