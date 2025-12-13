/* Requests Tests for MedShare */

import fetch from 'node-fetch';
import mongoose from 'mongoose';
import Medicine from '../src/models/Medicine.js';
import MedicineRequest from '../src/models/MedicineRequest.js';
import User from '../src/models/User.js';

const API = 'http://localhost:5000/api';
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medshare_test';

const users = {
  donor: { name: 'Req Donor', email: 'req_donor@test.com', password: 'Passw0rd!', role: 'DONOR' },
  recipient: { name: 'Req Recipient', email: 'req_recipient@test.com', password: 'Passw0rd!', role: 'RECIPIENT' },
  admin: { name: 'Req Admin', email: 'req_admin@test.com', password: 'Passw0rd!', role: 'ADMIN' }
};

function print(title, ok, details='') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${title}${details ? ' - ' + details : ''}`);
}

async function req(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function loginOrRegister(user) {
  let { res, data } = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password: user.password }) });
  if (res.status !== 200) {
    await req('/auth/register', { method: 'POST', body: JSON.stringify(user) });
    ({ res, data } = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password: user.password }) }));
  }
  return data.token;
}

async function cleanup() {
  await mongoose.connect(TEST_DB_URI);
  await Promise.all([
    User.deleteMany({ email: { $in: Object.values(users).map(u => u.email) } }),
    Medicine.deleteMany({ name: { $in: ['Request Medicine'] } }),
    MedicineRequest.deleteMany({})
  ]);
  await mongoose.disconnect();
}

export async function runRequestsTests() {
  console.log('🧪 Starting Requests Tests');

  let passed = 0, failed = 0;

  await cleanup();

  // Tokens
  const donorToken = await loginOrRegister(users.donor);
  const recipientToken = await loginOrRegister(users.recipient);
  const adminToken = await loginOrRegister(users.admin);

  // Donor adds a medicine
  const addBody = { name: 'Request Medicine', description: 'For requests flow', category: 'General', expiryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), quantity: 2 };
  let { res: addRes, data: addData } = await req('/medicines/add', { method: 'POST', headers: { Authorization: `Bearer ${donorToken}` }, body: JSON.stringify(addBody) });
  if (addRes.status !== 201) { print('Add medicine for requests', false, `status ${addRes.status}`); failed++; return false; } else { passed++; print('Add medicine for requests', true); }

  // Recipient creates a request
  const medicineId = addData.medicine.id;
  let { res: createRes, data: createData } = await req(`/requests/${medicineId}`, { method: 'POST', headers: { Authorization: `Bearer ${recipientToken}` } });
  if (createRes.status !== 201 || !createData.request || createData.request.status !== 'PENDING') { print('Recipient creates request', false, `status ${createRes.status}`); failed++; } else { passed++; print('Recipient creates request', true); }

  // Admin approves request -> inventory -1
  const requestId = createData.request._id || createData.request.id;
  let { res: approveRes } = await req(`/requests/${requestId}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
  if (approveRes.status !== 200) { print('Admin approves request', false, `status ${approveRes.status}`); failed++; } else { passed++; print('Admin approves request', true); }

  // Verify inventory decremented
  let { res: medGetRes, data: medGetData } = await req(`/medicines/donor/medicines`, { headers: { Authorization: `Bearer ${donorToken}` } });
  const updatedMed = medGetData.find(m => (m._id === medicineId) || (m.id === medicineId));
  if (!updatedMed || typeof updatedMed.quantity !== 'number' || updatedMed.quantity !== 1) { print('Inventory decremented', false); failed++; } else { passed++; print('Inventory decremented', true); }

  // Recipient creates second request
  ({ res: createRes, data: createData } = await req(`/requests/${medicineId}`, { method: 'POST', headers: { Authorization: `Bearer ${recipientToken}` } }));
  if (createRes.status !== 201) { print('Recipient creates second request', false, `status ${createRes.status}`); failed++; } else { passed++; print('Recipient creates second request', true); }

  // Admin rejects second request
  const requestId2 = createData.request._id || createData.request.id;
  let { res: rejectRes } = await req(`/requests/${requestId2}/reject`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
  if (rejectRes.status !== 200) { print('Admin rejects request', false, `status ${rejectRes.status}`); failed++; } else { passed++; print('Admin rejects request', true); }

  console.log(`\n📊 Results: Passed ${passed}, Failed ${failed}`);
  await cleanup();
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRequestsTests().then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error(e); process.exit(1); });
}
