/* Integration: recipient request triggers flow (HTTP-level) */

const API = 'http://localhost:5000/api';
const AUTH = `${API}/auth`;
const MED = `${API}/medicines`;

function randEmail(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2,8)}@medshare.local`;
}

function logStep(title, data) {
  console.log(`\n=== ${title} ===`);
  if (data !== undefined) console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

async function jsonOrEmpty(res) {
  try { return await res.json(); } catch { return {}; }
}

async function main() {
  // Setup donor and donation
  const donor = { name: 'Donor T', email: randEmail('donor'), password: 'Passw0rd!', role: 'DONOR' };
  let res = await fetch(`${AUTH}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donor) });
  await jsonOrEmpty(res);
  res = await fetch(`${AUTH}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: donor.email, password: donor.password }) });
  const donorLogin = await jsonOrEmpty(res);
  const medPayload = { name: 'Ibuprofen 200mg', description: 'Test', expiryDate: '2026-10-31', quantity: 2 };
  res = await fetch(`${MED}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${donorLogin.token}` }, body: JSON.stringify(medPayload) });
  const donJson = await jsonOrEmpty(res);
  if (res.status !== 201) throw new Error('Donation init failed');

  // Register recipient
  const recipient = { name: 'Recipient T', email: randEmail('recipient'), password: 'Passw0rd!', role: 'RECIPIENT' };
  res = await fetch(`${AUTH}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipient) });
  await jsonOrEmpty(res);
  res = await fetch(`${AUTH}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: recipient.email, password: recipient.password }) });
  const recLogin = await jsonOrEmpty(res);

  // List medicines and request one
  res = await fetch(`${MED}`, { headers: { Authorization: `Bearer ${recLogin.token}` } });
  const meds = await jsonOrEmpty(res);
  const pick = meds.find(m => m.name.includes('Ibuprofen'));
  if (!pick) throw new Error('No medicine available to request');
  res = await fetch(`${MED}/request/${pick._id}`, { method: 'POST', headers: { Authorization: `Bearer ${recLogin.token}` } });
  const reqJson = await jsonOrEmpty(res);
  logStep('Request submit', `${res.status}: ${reqJson.message}`);
  if (res.status !== 200 && res.status !== 201) throw new Error('Request submission failed');

  console.log('\n🎉 Request flow passed. Emails were triggered server-side if SMTP is configured.');
}

main().catch(err => { console.error('❌ Test failed:', err.message || err); process.exit(1); });


