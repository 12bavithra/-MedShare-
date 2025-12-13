import cron from 'node-cron';
import { runExpiryReminderCheck } from '../services/expiryReminder.js';

// Run daily at 09:00
cron.schedule('0 9 * * *', () => {
  runExpiryReminderCheck();
});

export default {};


