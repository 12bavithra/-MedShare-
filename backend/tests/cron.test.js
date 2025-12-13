/* Cron Expiry Reminder Tests */

import mongoose from 'mongoose';
import { runOnce } from '../cron/expiryReminder.js';
import Medicine from '../src/models/Medicine.js';
import User from '../src/models/User.js';

// Mock sendEmail by patching the util at runtime
import * as emailUtil from '../src/utils/email.js';

function print(title, ok, details='') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${title}${details ? ' - ' + details : ''}`);
}

export async function runCronTests() {
  console.log('🧪 Starting Cron Tests');

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medshare_test';
  await mongoose.connect(uri);

  // Seed donor and medicine expiring in 3 days
  const donor = await User.create({ name: 'Cron Donor', email: 'cron_donor@test.com', passwordHash: 'x', role: 'DONOR' });
  const expSoon = await Medicine.create({
    name: 'Cron Expiring Med',
    description: 'To test expiry reminders',
    category: 'General',
    expiryDate: new Date(Date.now() + 3*24*60*60*1000),
    quantity: 5,
    status: 'AVAILABLE',
    donor: donor._id
  });

  // Mock sendEmail to count calls
  let emails = 0;
  const originalSend = emailUtil.sendEmail;
  emailUtil.sendEmail = async () => { emails++; return { success: true, messageId: 'mock' }; };

  try {
    const result = await runOnce();
    const okExpireFlag = typeof result.markedExpired === 'number';
    const okReminderCount = typeof result.remindersSent === 'number' && emails >= 1;
    print('Cron runOnce returns summary', okExpireFlag && okReminderCount);
  } finally {
    emailUtil.sendEmail = originalSend;
    await Medicine.deleteMany({ name: 'Cron Expiring Med' });
    await User.deleteMany({ email: 'cron_donor@test.com' });
    await mongoose.disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCronTests().then(ok => process.exit(ok ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
}
