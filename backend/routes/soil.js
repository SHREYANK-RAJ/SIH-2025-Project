// Basic soil route placeholder
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Soil route working!' });
});

module.exports = router;
