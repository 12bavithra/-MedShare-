/* End-to-end auth flow test using built-in fetch (Node 18+) */

const API = 'http://localhost:5000/api/auth';

const randomSuffix = Math.random().toString(36).slice(2, 8);
const testUser = {
  name: 'Test User',
  email: `test_${randomSuffix}@medshare.local`,
  password: 'Passw0rd!',
  role: 'DONOR'
};

function print(title, obj) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
}

async function main() {
  // Register
  const regRes = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regJson = await regRes.json().catch(() => ({}));
  print('Register status', `${regRes.status}`);
  print('Register response', regJson);

  // Login
  const loginRes = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  const loginJson = await loginRes.json().catch(() => ({}));
  print('Login status', `${loginRes.status}`);
  print('Login response', loginJson);

  if (!loginJson.token) {
    process.exitCode = 1;
    console.error('No token returned from login.');
    return;
  }

  // Me
  const meRes = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${loginJson.token}` }
  });
  const meJson = await meRes.json().catch(() => ({}));
  print('Me status', `${meRes.status}`);
  print('Me response', meJson);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


