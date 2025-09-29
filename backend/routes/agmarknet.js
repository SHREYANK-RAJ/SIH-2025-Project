// backend/routes/agmarknet.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Example: Agmarknet API endpoint (public dataset)
const AGMARKNET_BASE_URL = 'https://data.gov.in/node/328681/datastore/export/json';

// GET /api/agmarknet/:commodity (optional: ?state=...&market=...)
router.get('/:commodity', async (req, res) => {
  const { commodity } = req.params;
  const { state, market } = req.query;
  try {
    // Fetch data from Agmarknet (filtering will be done client-side for demo)
    const response = await axios.get(AGMARKNET_BASE_URL);
    // Filter results for commodity, state, market if provided
    let data = response.data;
    if (commodity) {
      data = data.filter(item => item.commodity && item.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    if (state) {
      data = data.filter(item => item.state && item.state.toLowerCase().includes(state.toLowerCase()));
    }
    if (market) {
      data = data.filter(item => item.market && item.market.toLowerCase().includes(market.toLowerCase()));
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch market prices', error: error.message });
  }
});

module.exports = router;
