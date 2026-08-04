import app from './app.js';
import appConfig from './config/app.config.js';
import prisma from './core/prisma.js';
import { initializeIndices } from './search/init.js';

const startServer = async () => {
  try {
    // Verify database connection via Prisma
    await prisma.$connect();
    console.log('✅ Database connected successfully.');
    
    // Initialize Elasticsearch indices (graceful fallback applies)
    await initializeIndices();

    app.listen(appConfig.port, () => {
      console.log(`🚀 Server is running on port ${appConfig.port}`);
      console.log(`📍 Environment: ${appConfig.env}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// ── Graceful Shutdown ──
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
