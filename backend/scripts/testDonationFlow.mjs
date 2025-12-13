/* Integration: donor donation triggers flow (HTTP-level) */

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
  // Register donor
  const donor = { name: 'Donor Test', email: randEmail('donor'), password: 'Passw0rd!', role: 'DONOR' };
  let res = await fetch(`${AUTH}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donor) });
  logStep('Register donor status', `${res.status}`);
  await jsonOrEmpty(res);

  // Login donor
  res = await fetch(`${AUTH}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: donor.email, password: donor.password }) });
  const donorLogin = await jsonOrEmpty(res);
  logStep('Login donor status', `${res.status}`);
  if (!donorLogin.token) throw new Error('Donor token missing');

  // Donate medicine
  const payload = { name: 'TestParacetamol', description: 'Test batch', expiryDate: '2026-12-31', quantity: 2, category: 'Pain Relief' };
  res = await fetch(`${MED}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${donorLogin.token}` }, body: JSON.stringify(payload) });
  const donate = await jsonOrEmpty(res);
  logStep('Donate medicine', `${res.status}: ${donate.message}`);
  if (res.status !== 201) throw new Error('Donation failed');

  // Re-donate same item to test merge
  res = await fetch(`${MED}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${donorLogin.token}` }, body: JSON.stringify(payload) });
  const donate2 = await jsonOrEmpty(res);
  logStep('Re-donate same medicine', `${res.status}: ${donate2.message}`);

  // Verify donor list shows merged quantity
  res = await fetch(`${MED}/donor/medicines`, { headers: { Authorization: `Bearer ${donorLogin.token}` } });
  const list = await jsonOrEmpty(res);
  const item = list.find(m => m.name === payload.name && new Date(m.expiryDate).toISOString().startsWith('2026-12-31'));
  logStep('Donor medicines found', `${list.length}`);
  if (!item) throw new Error('Donated item not found');
  if ((item.quantity || 0) < 3) throw new Error('Quantity did not merge as expected');

  console.log('\n🎉 Donation flow (incl. merge) passed. Emails were triggered server-side if SMTP is configured.');
}

main().catch(err => { console.error('❌ Test failed:', err.message || err); process.exit(1); });


