const app = require('./app');
const appConfig = require('./config/app.config');
const { connectDB } = require('./database/connection');

const startServer = async () => {
  try {
    await connectDB();
    app.listen(appConfig.port, () => {
      console.log(`Server is running on port ${appConfig.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
