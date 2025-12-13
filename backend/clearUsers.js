import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';

async function main() {
  try {
    await connectDB();
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} user(s) from the users collection`);
  } catch (err) {
    console.error('❌ Failed to clear users:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

main();


