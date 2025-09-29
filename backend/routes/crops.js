// Basic crops route placeholder
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Crops route working!' });
});

module.exports = router;
