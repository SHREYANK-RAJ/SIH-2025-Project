// Basic market route placeholder
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Market route working!' });
});

module.exports = router;
