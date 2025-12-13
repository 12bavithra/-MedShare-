import mongoose from 'mongoose';
import User from './src/models/User.js';
import Medicine from './src/models/Medicine.js';
import MedicineRequest from './src/models/MedicineRequest.js';
import dotenv from 'dotenv';

dotenv.config();

async function clearTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🗑️ Clearing test data...');
    
    // Clear test users (keep real email addresses)
    const realEmails = [
      'prjeevasri@gmail.com',
      'dfghjkl@gmail.com', 
      'ilakkiyajothi040804@gmail.com',
      'bavithra1210@gmail.com',
      'meyy3@gmail.com',
      'bala@gmail.com',
      '12bavithra102004@gmail.com'
    ];
    
    const testUsers = await User.find({ 
      email: { $not: { $in: realEmails } } 
    });
    
    console.log(`Found ${testUsers.length} test users to delete`);
    
    // Delete test medicines
    const testMedicines = await Medicine.find({
      donor: { $in: testUsers.map(u => u._id) }
    });
    
    console.log(`Found ${testMedicines.length} test medicines to delete`);
    
    // Delete test requests
    const testRequests = await MedicineRequest.find({
      $or: [
        { recipientId: { $in: testUsers.map(u => u._id) } },
        { medicineId: { $in: testMedicines.map(m => m._id) } }
      ]
    });
    
    console.log(`Found ${testRequests.length} test requests to delete`);
    
    // Delete in order (requests first, then medicines, then users)
    await MedicineRequest.deleteMany({
      _id: { $in: testRequests.map(r => r._id) }
    });
    
    await Medicine.deleteMany({
      _id: { $in: testMedicines.map(m => m._id) }
    });
    
    await User.deleteMany({
      _id: { $in: testUsers.map(u => u._id) }
    });
    
    console.log('✅ Test data cleared successfully!');
    console.log('📊 Remaining users:');
    
    const remainingUsers = await User.find({}, 'name email role');
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearTestData();
