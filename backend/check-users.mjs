import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Current users in database:');
    const users = await User.find({}, 'name email role createdAt').sort('-createdAt');
    console.log('Total users:', users.length);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.createdAt.toLocaleDateString()}`);
    });
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
