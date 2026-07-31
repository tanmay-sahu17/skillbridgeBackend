const { verifyToken } = require('../utils/jwt');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Token missing.' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Token is invalid or expired.' 
    });
  }

  req.user = decoded;
  next();
};

module.exports = {
  protect,
};
