export const validate = (schema) => (req, res, next) => {
  try {
    const parsedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Replace req properties with validated ones
    req.body = parsedData.body;
    req.query = parsedData.query;
    req.params = parsedData.params;
    
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      })),
    });
  }
};
