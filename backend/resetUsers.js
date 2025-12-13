import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';

async function main() {
  try {
    await connectDB();
    await User.deleteMany({});
    console.log('✅ All user accounts cleared successfully. You can now test with fresh accounts.');
  } catch (err) {
    console.error('❌ Failed to reset users:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();


