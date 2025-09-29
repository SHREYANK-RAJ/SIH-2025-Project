// backend/routes/soilgrids.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// SoilGrids API endpoint
const SOILGRIDS_BASE_URL = 'https://rest.soilgrids.org/query';

// GET /api/soilgrids/:lat/:lon
router.get('/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  try {
    const response = await axios.get(`${SOILGRIDS_BASE_URL}`, {
      params: { lon, lat }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch soil data', error: error.message });
  }
});

module.exports = router;
