import mongoose from 'mongoose';

const medicineRequestSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

export default mongoose.model('MedicineRequest', medicineRequestSchema);


