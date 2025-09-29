// Basic error handler middleware
module.exports = function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};
