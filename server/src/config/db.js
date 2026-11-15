import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snackstore';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Could not connect to '${uri}': ${error.message}`);
    console.log('[Database] Initiating in-memory MongoDB fallback for local testing...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB connected: ${memoryUri}`);

      // Auto-seed in-memory database with mouthwatering snacks
      const { seedInternal } = await import('../seed/seedDataHelper.js');
      await seedInternal();

      return conn;
    } catch (memErr) {
      console.error('[Database Error] In-Memory MongoDB failed to start:', memErr.message);
      console.warn('[Database Notice] Please provide a valid MONGODB_URI in server/.env (e.g. MongoDB Atlas).');
    }
  }
}
