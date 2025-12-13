import cron from 'node-cron';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Medicine from '../src/models/Medicine.js';
import User from '../src/models/User.js';
import { sendEmail } from '../src/utils/email.js';

dotenv.config();

function daysUntil(date) {
	const now = new Date();
	const target = new Date(date);
	return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export async function runOnce() {
	const start = Date.now();
	let markedExpired = 0;
	let remindersSent = 0;
	try {
		// Ensure DB connected if running standalone
		if (mongoose.connection.readyState === 0) {
			const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
			if (!uri) throw new Error('MONGODB_URI is not set');
			await mongoose.connect(uri);
		}

		const now = new Date();
		const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

		// Mark past-due as EXPIRED
		const toExpire = await Medicine.find({ status: { $in: ['AVAILABLE', 'CLAIMED'] }, expiryDate: { $lt: now } });
		if (toExpire.length) {
			await Medicine.updateMany({ _id: { $in: toExpire.map(m => m._id) } }, { status: 'EXPIRED' });
			markedExpired = toExpire.length;
		}

		// Find items expiring within 7 days and still AVAILABLE
		const expiringSoon = await Medicine.find({ status: 'AVAILABLE', expiryDate: { $gte: now, $lte: in7Days } })
			.populate('donor', 'name email');

		for (const med of expiringSoon) {
			const d = daysUntil(med.expiryDate);
			// donor email
			if (med.donor?.email) {
				try {
					const html = `
					  <h2>⏰ Medicine Nearing Expiry</h2>
					  <p>Dear ${med.donor.name}, your donation is nearing expiry in ${d} day(s).</p>
					  <ul>
					    <li><strong>Medicine:</strong> ${med.name}</li>
					    <li><strong>Quantity:</strong> ${med.quantity}</li>
					    <li><strong>Expiry:</strong> ${new Date(med.expiryDate).toLocaleDateString()}</li>
					  </ul>`;
					const r = await sendEmail(med.donor.email, 'Expiry Reminder - MedShare', html);
					if (r.success) remindersSent++;
				} catch (_) {}
			}
			// admin email
			if (process.env.ADMIN_EMAIL) {
				try {
					const html = `
					  <h2>⏰ Inventory Expiry Reminder</h2>
					  <ul>
					    <li><strong>Medicine:</strong> ${med.name}</li>
					    <li><strong>Quantity:</strong> ${med.quantity}</li>
					    <li><strong>Expiry:</strong> ${new Date(med.expiryDate).toLocaleDateString()}</li>
					    <li><strong>Donor:</strong> ${med.donor?.name || 'Unknown'} (${med.donor?.email || 'N/A'})</li>
					  </ul>`;
					const r = await sendEmail(process.env.ADMIN_EMAIL, 'Inventory Expiry Reminder - MedShare', html);
					if (r.success) remindersSent++;
				} catch (_) {}
			}
		}

		const ms = Date.now() - start;
		console.log(`✅ Expiry job complete: expired=${markedExpired}, reminders=${remindersSent}, took=${ms}ms`);
		return { markedExpired, remindersSent };
	} catch (err) {
		console.error('❌ Expiry job failed:', err.message);
		return { markedExpired, remindersSent, error: err.message };
	}
}

export function scheduleMidnight() {
	// Run daily at midnight
	return cron.schedule('0 0 * * *', () => {
		runOnce();
	});
}

// CLI entry: node cron/expiryReminder.js [--once]
if (import.meta.url === `file://${process.argv[1]}`) {
	const once = process.argv.includes('--once');
	if (once) {
		runOnce().then(() => process.exit(0)).catch(() => process.exit(1));
	} else {
		console.log('🕛 Scheduling expiry reminder at 00:00 daily...');
		scheduleMidnight();
	}
}
