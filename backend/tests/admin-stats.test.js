/* Admin Stats Tests */

import mongoose from 'mongoose';
import fetch from 'node-fetch';
import User from '../src/models/User.js';
import Medicine from '../src/models/Medicine.js';
import MedicineRequest from '../src/models/MedicineRequest.js';
import bcrypt from 'bcryptjs';

const API = 'http://localhost:5000/api';

function print(title, ok, details='') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${title}${details ? ' - ' + details : ''}`);
}

async function loginOrRegister(user) {
  let res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
  if (res.status !== 200) {
    await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
  }
  const data = await res.json();
  return data.token;
}

export async function runAdminStatsTests() {
  console.log('🧪 Starting Admin Stats Tests');

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medshare_test';
  await mongoose.connect(uri);

  // Seed baseline
  const donor = { name: 'Stats Donor', email: 'stats_donor@test.com', password: 'Passw0rd!', role: 'DONOR' };
  const recipient = { name: 'Stats Recipient', email: 'stats_recipient@test.com', password: 'Passw0rd!', role: 'RECIPIENT' };
  const admin = { name: 'Stats Admin', email: 'stats_admin@test.com', password: 'Passw0rd!', role: 'ADMIN' };

  const donorToken = await loginOrRegister(donor);
  const recipientToken = await loginOrRegister(recipient);
  const adminToken = await loginOrRegister(admin);

  // Add medicines
  const medBodies = [
    { name: 'Stats Med A', category: 'Cat', description: 'A', expiryDate: new Date(Date.now()+7*24*60*60*1000).toISOString(), quantity: 3 },
    { name: 'Stats Med B', category: 'Cat', description: 'B', expiryDate: new Date(Date.now()-1*24*60*60*1000).toISOString(), quantity: 1 }
  ];

  for (const body of medBodies) {
    await fetch(`${API}/medicines/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${donorToken}` }, body: JSON.stringify(body) });
  }

  // Fetch donor medicines to get IDs
  let listRes = await fetch(`${API}/medicines/donor/medicines`, { headers: { Authorization: `Bearer ${donorToken}` } });
  const list = await listRes.json();
  const medA = list.find(m => m.name === 'Stats Med A');

  // Create and approve a request
  let reqRes = await fetch(`${API}/requests/${medA._id || medA.id}`, { method: 'POST', headers: { Authorization: `Bearer ${recipientToken}` } });
  const reqDoc = await reqRes.json();
  // Approve by admin via requests route
  await fetch(`${API}/requests/${reqDoc.request._id || reqDoc.request.id}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });

  // Call stats
  const statsRes = await fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const stats = await statsRes.json();

  const ok = typeof stats.totalUsers === 'number'
    && typeof stats.totalDonations === 'number'
    && typeof stats.totalRequests === 'number'
    && typeof stats.approved === 'number'
    && typeof stats.rejected === 'number'
    && typeof stats.availableMedicines === 'number'
    && typeof stats.expiredMedicines === 'number';

  print('Admin stats shape', ok);

  await mongoose.disconnect();
  return ok;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminStatsTests().then(ok => process.exit(ok ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
}
