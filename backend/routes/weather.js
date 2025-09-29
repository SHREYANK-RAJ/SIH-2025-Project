// Basic weather route placeholder
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Weather route working!' });
});

module.exports = router;
