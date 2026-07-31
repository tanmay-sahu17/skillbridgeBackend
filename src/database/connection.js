const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');

const connectDB = async () => {
  await mongoose.connect(dbConfig.uri, dbConfig.options);
  console.log('MongoDB connected successfully.');
};

module.exports = {
  connectDB,
};
