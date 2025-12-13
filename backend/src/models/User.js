import mongoose from 'mongoose';

const ROLES = ['DONOR', 'RECIPIENT', 'ADMIN'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLES, default: 'RECIPIENT' },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export default mongoose.model('User', userSchema);


