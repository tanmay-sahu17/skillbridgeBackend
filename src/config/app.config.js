require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_jwt_key_should_be_replaced_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
