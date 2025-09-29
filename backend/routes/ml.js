// backend/routes/ml.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// ML service endpoint (adjust if running on a different port)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// POST /api/ml/predict-crop
router.post('/predict-crop', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-crop`, req.body);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ML prediction failed', error: error.message });
  }
});

// POST /api/ml/predict-yield
router.post('/predict-yield', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-yield`, req.body);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ML prediction failed', error: error.message });
  }
});

module.exports = router;
