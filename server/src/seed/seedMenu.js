import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { seedInternal } from './seedDataHelper.js';

async function runSeed() {
  try {
    await connectDB();
    await seedInternal();
    console.log('[Seed] Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}

runSeed();
