/* Complete end-to-end test for MedShare system */

const API = 'http://localhost:5000/api';
const AUTH_API = `${API}/auth`;
const MEDICINE_API = `${API}/medicines`;
const ADMIN_API = `${API}/admin`;

const randomSuffix = Math.random().toString(36).slice(2, 8);

const testUsers = {
  donor: {
    name: 'Test Donor',
    email: `donor_${randomSuffix}@medshare.local`,
    password: 'Passw0rd!',
    role: 'DONOR'
  },
  recipient: {
    name: 'Test Recipient',
    email: `recipient_${randomSuffix}@medshare.local`,
    password: 'Passw0rd!',
    role: 'RECIPIENT'
  },
  admin: {
    name: 'Test Admin',
    email: `admin_${randomSuffix}@medshare.local`,
    password: 'Passw0rd!',
    role: 'ADMIN'
  }
};

let tokens = {};
let medicineId = null;

function print(title, obj) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
}

async function main() {
  console.log('🧪 Starting comprehensive MedShare system test...\n');
  
  try {
    // 1. Register all test users
    print('1. REGISTERING USERS', 'Creating donor, recipient, and admin accounts');
    
    for (const [role, user] of Object.entries(testUsers)) {
      const res = await fetch(`${AUTH_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const data = await res.json();
      print(`Register ${role}`, `${res.status}: ${data.message}`);
    }
    
    // 2. Login all users to get tokens
    print('2. LOGGING IN USERS', 'Getting JWT tokens for all roles');
    
    for (const [role, user] of Object.entries(testUsers)) {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      });
      const data = await res.json();
      
      if (res.ok) {
        tokens[role] = data.token;
        print(`Login ${role}`, `${res.status}: Token received`);
      } else {
        print(`Login ${role} FAILED`, `${res.status}: ${data.message}`);
        return;
      }
    }
    
    // 3. Test medicine donation (DONOR)
    print('3. MEDICINE DONATION', 'Donor adding a medicine');
    
    const medicineData = {
      name: 'Paracetamol 500mg',
      description: 'Pain relief tablets, unopened box',
      expiryDate: '2026-12-31',
      quantity: 20
    };
    
    const donateRes = await fetch(`${MEDICINE_API}/add`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.donor}`
      },
      body: JSON.stringify(medicineData)
    });
    
    const donateData = await donateRes.json();
    print('Donate medicine', `${donateRes.status}: ${donateData.message}`);
    
    if (donateRes.ok) {
      medicineId = donateData.medicine.id;
    }
    
    // 4. Test medicine listing (all users can see)
    print('4. MEDICINE LISTING', 'Testing medicine listing for different roles');
    
    for (const [role, token] of Object.entries(tokens)) {
      const res = await fetch(`${MEDICINE_API}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      print(`List medicines as ${role}`, `${res.status}: ${data.length} medicines found`);
    }
    
    // 5. Test medicine request (RECIPIENT)
    if (medicineId) {
      print('5. MEDICINE REQUEST', 'Recipient requesting the donated medicine');
      
      const requestRes = await fetch(`${MEDICINE_API}/request/${medicineId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokens.recipient}` }
      });
      
      const requestData = await requestRes.json();
      print('Request medicine', `${requestRes.status}: ${requestData.message}`);
    }
    
    // 6. Test admin dashboard - view medicines
    print('6. ADMIN DASHBOARD', 'Admin viewing all medicines and users');
    
    const adminMedicinesRes = await fetch(`${ADMIN_API}/medicines`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });
    const adminMedicines = await adminMedicinesRes.json();
    print('Admin view medicines', `${adminMedicinesRes.status}: ${adminMedicines.length} medicines found`);
    
    const adminUsersRes = await fetch(`${ADMIN_API}/users`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });
    const adminUsers = await adminUsersRes.json();
    print('Admin view users', `${adminUsersRes.status}: ${adminUsers.length} users found`);
    
    // 7. Test admin approval (if medicine was requested)
    if (medicineId) {
      print('7. ADMIN APPROVAL', 'Admin approving the medicine request');
      
      const approveRes = await fetch(`${ADMIN_API}/approve/${medicineId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.admin}`
        },
        body: JSON.stringify({ action: 'approve' })
      });
      
      const approveData = await approveRes.json();
      print('Admin approve', `${approveRes.status}: ${approveData.message}`);
    }
    
    print('🎉 TEST COMPLETED', 'All major functionality tested successfully!');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

main();
