import Medicine from '../models/Medicine.js';
import { sendEmail } from '../utils/email.js';

function daysUntil(date) {
  const now = new Date();
  const target = new Date(date);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export async function runExpiryReminderCheck() {
  const now = new Date();
  try {
    console.log('🔎 Running expiry reminder check...');
    const meds = await Medicine.find({ status: { $in: ['AVAILABLE', 'CLAIMED'] } })
      .populate('donor', 'name email');

    for (const med of meds) {
      // Auto-mark expired
      if (med.expiryDate < now && med.status !== 'EXPIRED') {
        med.status = 'EXPIRED';
        await med.save();
        console.log(`📌 Auto-marked expired: ${med.name} (ID: ${med._id})`);
        continue;
      }

      const d = daysUntil(med.expiryDate);
      if (d >= 0 && d <= 7) {
        // donor
        if (med.donor?.email) {
          const donorHtml = `
            <h2>⏰ Medicine Nearing Expiry</h2>
            <p>Dear ${med.donor.name}, your donation is nearing expiry in ${d} day(s).</p>
            <ul>
              <li><strong>Medicine:</strong> ${med.name}</li>
              <li><strong>Quantity:</strong> ${med.quantity}</li>
              <li><strong>Expiry:</strong> ${new Date(med.expiryDate).toLocaleDateString()}</li>
            </ul>`;
          const r1 = await sendEmail(med.donor.email, 'Expiry Reminder - MedShare', donorHtml);
          console.log(r1.success ? `✅ Donor reminder sent: ${med.donor.email}` : `⚠️ Donor reminder failed: ${med.donor.email}`);
        }
        // admin
        if (process.env.ADMIN_EMAIL) {
          const adminHtml = `
            <h2>⏰ Inventory Expiry Reminder</h2>
            <p>A medicine is nearing expiry in ${d} day(s).</p>
            <ul>
              <li><strong>Medicine:</strong> ${med.name}</li>
              <li><strong>Quantity:</strong> ${med.quantity}</li>
              <li><strong>Expiry:</strong> ${new Date(med.expiryDate).toLocaleDateString()}</li>
              <li><strong>Donor:</strong> ${med.donor?.name || 'Unknown'} (${med.donor?.email || 'N/A'})</li>
            </ul>`;
          const r2 = await sendEmail(process.env.ADMIN_EMAIL, 'Inventory Expiry Reminder - MedShare', adminHtml);
          console.log(r2.success ? `✅ Admin reminder sent: ${process.env.ADMIN_EMAIL}` : `⚠️ Admin reminder failed: ${process.env.ADMIN_EMAIL}`);
        }
      }
    }
    console.log('✅ Expiry reminder check completed');
  } catch (err) {
    console.error('❌ Expiry reminder check error:', err.message);
  }
}

export default { runExpiryReminderCheck };


