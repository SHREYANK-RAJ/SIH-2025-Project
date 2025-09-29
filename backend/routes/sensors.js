// Basic sensors route placeholder
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Sensors route working!' });
});

module.exports = router;
