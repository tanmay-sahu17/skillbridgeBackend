const jwt = require('jsonwebtoken');
const appConfig = require('../config/app.config');

const generateToken = (payload) => {
  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.expiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwt.secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
