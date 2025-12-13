/* Test donor and recipient dashboard endpoints */

const API = 'http://localhost:5000/api';
const AUTH_API = `${API}/auth`;
const MEDICINE_API = `${API}/medicines`;

const randomSuffix = Math.random().toString(36).slice(2, 8);

const testUsers = {
  donor: {
    name: 'Dash Donor',
    email: `dash_donor_${randomSuffix}@medshare.local`,
    password: 'Passw0rd!',
    role: 'DONOR'
  },
  recipient: {
    name: 'Dash Recipient',
    email: `dash_recipient_${randomSuffix}@medshare.local`,
    password: 'Passw0rd!',
    role: 'RECIPIENT'
  }
};

let tokens = {};
let medicineId = null;

function print(title, obj) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
}

async function waitForServer(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch('http://localhost:5000/');
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log('🧪 Testing donor/recipient dashboard endpoints...');

  if (!(await waitForServer())) {
    console.error('Backend server not responding on http://localhost:5000');
    process.exit(1);
  }

  // Register donor and recipient
  for (const [role, user] of Object.entries(testUsers)) {
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    print(`Register ${role}`, `${res.status}: ${data.message}`);
  }

  // Login both users
  for (const [role, user] of Object.entries(testUsers)) {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      print(`Login ${role} FAILED`, data);
      process.exit(1);
    }
    tokens[role] = data.token;
    print(`Login ${role}`, `${res.status}: token acquired`);
  }

  // Donor adds a medicine
  const med = {
    name: 'Ibuprofen 200mg',
    description: 'Unopened pack',
    expiryDate: '2027-01-01',
    quantity: 10
  };
  const donateRes = await fetch(`${MEDICINE_API}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.donor}` },
    body: JSON.stringify(med)
  });
  const donateJson = await donateRes.json();
  print('Donate', `${donateRes.status}: ${donateJson.message}`);
  if (!donateRes.ok) process.exit(1);
  medicineId = donateJson.medicine.id;

  // Recipient requests the medicine
  const reqRes = await fetch(`${MEDICINE_API}/request/${medicineId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.recipient}` }
  });
  const reqJson = await reqRes.json();
  print('Request', `${reqRes.status}: ${reqJson.message}`);

  // Fetch donor dashboard data
  const donorDashRes = await fetch(`${MEDICINE_API}/donor/medicines`, {
    headers: { 'Authorization': `Bearer ${tokens.donor}` }
  });
  const donorDash = await donorDashRes.json();
  print('Donor dashboard list', { status: donorDashRes.status, count: Array.isArray(donorDash) ? donorDash.length : -1 });

  // Fetch recipient dashboard data
  const recipDashRes = await fetch(`${MEDICINE_API}/recipient/requests`, {
    headers: { 'Authorization': `Bearer ${tokens.recipient}` }
  });
  const recipDash = await recipDashRes.json();
  print('Recipient dashboard list', { status: recipDashRes.status, count: Array.isArray(recipDash) ? recipDash.length : -1 });

  console.log('\n🎉 Dashboard endpoints tested.');
}

main().catch(err => { console.error(err); process.exit(1); });


