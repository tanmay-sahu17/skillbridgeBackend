import jwt from 'jsonwebtoken';
import appConfig from '../config/app.config.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.expiresIn,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwt.secret);
  } catch (error) {
    return null;
  }
};
