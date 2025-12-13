/* Comprehensive Authentication Tests for MedShare */

import fetch from 'node-fetch';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const API_BASE = 'http://localhost:5000/api/auth';
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medshare_test';

// Test data
const testUsers = {
  donor: {
    name: 'Test Donor',
    email: 'donor@test.com',
    password: 'TestPass123!',
    role: 'DONOR'
  },
  recipient: {
    name: 'Test Recipient',
    email: 'recipient@test.com',
    password: 'TestPass123!',
    role: 'RECIPIENT'
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'TestPass123!',
    role: 'ADMIN'
  }
};

let createdUsers = {};

// Helper functions
function printTest(title, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  console.log(`${statusIcon} ${title}`);
  if (details) console.log(`   ${details}`);
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    return { response: null, data: { error: error.message } };
  }
}

async function cleanupDatabase() {
  try {
    await mongoose.connect(TEST_DB_URI);
    await User.deleteMany({ email: { $in: Object.values(testUsers).map(u => u.email) } });
    await mongoose.disconnect();
    printTest('Database cleanup', 'PASS', 'Test users removed');
  } catch (error) {
    printTest('Database cleanup', 'FAIL', error.message);
  }
}

// Test functions
async function testRegisterSuccess() {
  printTest('Register Success', '⏳', 'Testing successful user registration');
  
  const { response, data } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify(testUsers.donor)
  });
  
  if (response?.status === 201 && data.user && data.user.id) {
    createdUsers.donor = data.user;
    printTest('Register Success', 'PASS', `User created with ID: ${data.user.id}`);
    return true;
  } else {
    printTest('Register Success', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testRegisterDuplicate() {
  printTest('Register Duplicate', '⏳', 'Testing duplicate email registration');
  
  const { response, data } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify(testUsers.donor) // Same email as before
  });
  
  if (response?.status === 409 && data.message === 'Email already registered') {
    printTest('Register Duplicate', 'PASS', 'Correctly rejected duplicate email');
    return true;
  } else {
    printTest('Register Duplicate', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testRegisterValidation() {
  printTest('Register Validation', '⏳', 'Testing input validation');
  
  // Test missing fields
  const { response: missingFields, data: missingData } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test' }) // Missing email and password
  });
  
  if (missingFields?.status === 400 && missingData.message?.includes('required')) {
    printTest('Register Validation - Missing Fields', 'PASS', 'Correctly validated missing fields');
  } else {
    printTest('Register Validation - Missing Fields', 'FAIL', `Status: ${missingFields?.status}, Data: ${JSON.stringify(missingData)}`);
  }
  
  // Test invalid email
  const { response: invalidEmail, data: invalidEmailData } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test',
      email: 'invalid-email',
      password: 'TestPass123!'
    })
  });
  
  if (invalidEmail?.status === 400 && invalidEmailData.message?.includes('Invalid email format')) {
    printTest('Register Validation - Invalid Email', 'PASS', 'Correctly validated email format');
  } else {
    printTest('Register Validation - Invalid Email', 'FAIL', `Status: ${invalidEmail?.status}, Data: ${JSON.stringify(invalidEmailData)}`);
  }
  
  // Test weak password
  const { response: weakPassword, data: weakPasswordData } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test',
      email: 'test@example.com',
      password: '123' // Too short
    })
  });
  
  if (weakPassword?.status === 400 && weakPasswordData.message?.includes('at least 6 characters')) {
    printTest('Register Validation - Weak Password', 'PASS', 'Correctly validated password strength');
    return true;
  } else {
    printTest('Register Validation - Weak Password', 'FAIL', `Status: ${weakPassword?.status}, Data: ${JSON.stringify(weakPasswordData)}`);
    return false;
  }
}

async function testLoginSuccess() {
  printTest('Login Success', '⏳', 'Testing successful login');
  
  const { response, data } = await makeRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUsers.donor.email,
      password: testUsers.donor.password
    })
  });
  
  if (response?.status === 200 && data.token && data.user) {
    createdUsers.donorToken = data.token;
    printTest('Login Success', 'PASS', `Token received: ${data.token.substring(0, 20)}...`);
    return true;
  } else {
    printTest('Login Success', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testLoginInvalid() {
  printTest('Login Invalid', '⏳', 'Testing invalid login credentials');
  
  // Test wrong password
  const { response: wrongPassword, data: wrongPasswordData } = await makeRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUsers.donor.email,
      password: 'WrongPassword123!'
    })
  });
  
  if (wrongPassword?.status === 401 && wrongPasswordData.message === 'Invalid credentials') {
    printTest('Login Invalid - Wrong Password', 'PASS', 'Correctly rejected wrong password');
  } else {
    printTest('Login Invalid - Wrong Password', 'FAIL', `Status: ${wrongPassword?.status}, Data: ${JSON.stringify(wrongPasswordData)}`);
  }
  
  // Test non-existent user
  const { response: noUser, data: noUserData } = await makeRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'nonexistent@test.com',
      password: 'TestPass123!'
    })
  });
  
  if (noUser?.status === 401 && noUserData.message === 'Invalid credentials') {
    printTest('Login Invalid - Non-existent User', 'PASS', 'Correctly rejected non-existent user');
    return true;
  } else {
    printTest('Login Invalid - Non-existent User', 'FAIL', `Status: ${noUser?.status}, Data: ${JSON.stringify(noUserData)}`);
    return false;
  }
}

async function testMeSuccess() {
  printTest('Me Success', '⏳', 'Testing successful /me endpoint');
  
  if (!createdUsers.donorToken) {
    printTest('Me Success', 'FAIL', 'No token available for testing');
    return false;
  }
  
  const { response, data } = await makeRequest('/me', {
    headers: {
      'Authorization': `Bearer ${createdUsers.donorToken}`
    }
  });
  
  if (response?.status === 200 && data.id && data.email === testUsers.donor.email) {
    printTest('Me Success', 'PASS', `User data retrieved: ${data.name} (${data.role})`);
    return true;
  } else {
    printTest('Me Success', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testMeUnauthorized() {
  printTest('Me Unauthorized', '⏳', 'Testing unauthorized /me access');
  
  // Test without token
  const { response: noToken, data: noTokenData } = await makeRequest('/me');
  
  if (noToken?.status === 401 && noTokenData.message === 'No token provided') {
    printTest('Me Unauthorized - No Token', 'PASS', 'Correctly rejected request without token');
  } else {
    printTest('Me Unauthorized - No Token', 'FAIL', `Status: ${noToken?.status}, Data: ${JSON.stringify(noTokenData)}`);
  }
  
  // Test with invalid token
  const { response: invalidToken, data: invalidTokenData } = await makeRequest('/me', {
    headers: {
      'Authorization': 'Bearer invalid-token-123'
    }
  });
  
  if (invalidToken?.status === 401 && invalidTokenData.message?.includes('Invalid or expired token')) {
    printTest('Me Unauthorized - Invalid Token', 'PASS', 'Correctly rejected invalid token');
    return true;
  } else {
    printTest('Me Unauthorized - Invalid Token', 'FAIL', `Status: ${invalidToken?.status}, Data: ${JSON.stringify(invalidTokenData)}`);
    return false;
  }
}

async function testRoleAssignment() {
  printTest('Role Assignment', '⏳', 'Testing role assignment for different user types');
  
  // Test RECIPIENT role
  const { response: recipientRes, data: recipientData } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify(testUsers.recipient)
  });
  
  if (recipientRes?.status === 201 && recipientData.user?.role === 'RECIPIENT') {
    printTest('Role Assignment - RECIPIENT', 'PASS', 'RECIPIENT role assigned correctly');
  } else {
    printTest('Role Assignment - RECIPIENT', 'FAIL', `Status: ${recipientRes?.status}, Data: ${JSON.stringify(recipientData)}`);
  }
  
  // Test ADMIN role
  const { response: adminRes, data: adminData } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify(testUsers.admin)
  });
  
  if (adminRes?.status === 201 && adminData.user?.role === 'ADMIN') {
    printTest('Role Assignment - ADMIN', 'PASS', 'ADMIN role assigned correctly');
  } else {
    printTest('Role Assignment - ADMIN', 'FAIL', `Status: ${adminRes?.status}, Data: ${JSON.stringify(adminData)}`);
  }
  
  // Test default role (no role specified)
  const { response: defaultRes, data: defaultData } = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Default User',
      email: 'default@test.com',
      password: 'TestPass123!'
      // No role specified
    })
  });
  
  if (defaultRes?.status === 201 && defaultData.user?.role === 'RECIPIENT') {
    printTest('Role Assignment - Default', 'PASS', 'Default RECIPIENT role assigned correctly');
    return true;
  } else {
    printTest('Role Assignment - Default', 'FAIL', `Status: ${defaultRes?.status}, Data: ${JSON.stringify(defaultData)}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting MedShare Authentication Tests\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'Register Success', fn: testRegisterSuccess },
    { name: 'Register Duplicate', fn: testRegisterDuplicate },
    { name: 'Register Validation', fn: testRegisterValidation },
    { name: 'Login Success', fn: testLoginSuccess },
    { name: 'Login Invalid', fn: testLoginInvalid },
    { name: 'Me Success', fn: testMeSuccess },
    { name: 'Me Unauthorized', fn: testMeUnauthorized },
    { name: 'Role Assignment', fn: testRoleAssignment }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
      }
      results.total++;
    } catch (error) {
      printTest(test.name, 'FAIL', `Error: ${error.message}`);
      results.failed++;
      results.total++;
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.total}`);
  console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Authentication module is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  // Cleanup
  await cleanupDatabase();
  
  return results.failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { runAllTests, testUsers, createdUsers };
