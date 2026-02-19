// Global error handling middleware (ESM)
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.statusCode || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      statusCode: err.statusCode || 500,
    },
  });
};

export default errorHandler;
