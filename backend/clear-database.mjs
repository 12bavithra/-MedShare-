// Database clearing script (use with caution!)
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Medicine from './src/models/Medicine.js';
import MedicineRequest from './src/models/MedicineRequest.js';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/medshare');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function clearDatabase() {
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('🔄 Clearing MedShare database...\n');
  
  await connectDB();
  
  try {
    // Clear all collections
    const userCount = await User.countDocuments();
    const medicineCount = await Medicine.countDocuments();
    const requestCount = await MedicineRequest.countDocuments();
    
    console.log(`📊 Current data:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Medicines: ${medicineCount}`);
    console.log(`   Requests: ${requestCount}\n`);
    
    // Delete all documents
    await User.deleteMany({});
    await Medicine.deleteMany({});
    await MedicineRequest.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    console.log('🎉 You can now register with any email address');
    console.log('💡 Remember to create new users for testing');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
  
  process.exit(0);
}

clearDatabase();
