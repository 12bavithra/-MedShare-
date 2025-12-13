/* Comprehensive Medicines Tests for MedShare */

import fetch from 'node-fetch';
import mongoose from 'mongoose';
import Medicine from '../src/models/Medicine.js';
import User from '../src/models/User.js';

const API_BASE = 'http://localhost:5000/api';
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medshare_test';

// Test data
const testUsers = {
  donor: {
    name: 'Test Donor',
    email: 'donor@medicines.test',
    password: 'TestPass123!',
    role: 'DONOR'
  },
  recipient: {
    name: 'Test Recipient',
    email: 'recipient@medicines.test',
    password: 'TestPass123!',
    role: 'RECIPIENT'
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@medicines.test',
    password: 'TestPass123!',
    role: 'ADMIN'
  }
};

const testMedicines = {
  paracetamol: {
    name: 'Paracetamol 500mg',
    description: 'Pain relief medication',
    category: 'Pain Relief',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    quantity: 50
  },
  aspirin: {
    name: 'Aspirin 100mg',
    description: 'Blood thinner and pain relief',
    category: 'Cardiovascular',
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    quantity: 30
  },
  expired: {
    name: 'Expired Medicine',
    description: 'This medicine is expired',
    category: 'Test',
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    quantity: 10
  }
};

let authTokens = {};
let createdMedicines = {};

// Helper functions
function printTest(title, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  console.log(`${statusIcon} ${title}`);
  if (details) console.log(`   ${details}`);
}

async function makeRequest(endpoint, options = {}) {
  try {
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Ensure body is properly set
    if (options.body) {
      requestOptions.body = options.body;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, requestOptions);
    
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    return { response: null, data: { error: error.message } };
  }
}

async function authenticateUser(userType) {
  if (authTokens[userType]) {
    return authTokens[userType];
  }

  // Try to login first (user might already exist)
  const { response: loginRes, data: loginData } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUsers[userType].email,
      password: testUsers[userType].password
    })
  });

  if (loginRes?.status === 200 && loginData.token) {
    authTokens[userType] = loginData.token;
    return loginData.token;
  }

  // If login failed, try to register
  const { response: regRes } = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUsers[userType])
  });

  if (regRes?.status === 201) {
    // Login after successful registration
    const { response: newLoginRes, data: newLoginData } = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUsers[userType].email,
        password: testUsers[userType].password
      })
    });

    if (newLoginRes?.status === 200 && newLoginData.token) {
      authTokens[userType] = newLoginData.token;
      return newLoginData.token;
    }
  }

  throw new Error(`Failed to authenticate ${userType}: Login ${loginRes?.status}, Register ${regRes?.status}`);
}

async function cleanupDatabase() {
  try {
    await mongoose.connect(TEST_DB_URI);
    await Medicine.deleteMany({ name: { $in: Object.values(testMedicines).map(m => m.name) } });
    await User.deleteMany({ email: { $in: Object.values(testUsers).map(u => u.email) } });
    await mongoose.disconnect();
    printTest('Database cleanup', 'PASS', 'Test data removed');
  } catch (error) {
    printTest('Database cleanup', 'FAIL', error.message);
  }
}

// Test functions
async function testAddMedicine() {
  printTest('Add Medicine', '⏳', 'Testing medicine addition by donor');
  
  const token = await authenticateUser('donor');
  
  const { response, data } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(testMedicines.paracetamol)
  });
  
  if (response?.status === 201 && data.medicine && data.medicine.id) {
    createdMedicines.paracetamol = data.medicine;
    printTest('Add Medicine', 'PASS', `Medicine added with ID: ${data.medicine.id}`);
    return true;
  } else {
    printTest('Add Medicine', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testAddMedicineValidation() {
  printTest('Add Medicine Validation', '⏳', 'Testing input validation for medicine addition');
  
  const token = await authenticateUser('donor');
  
  // Test missing required fields
  const { response: missingFields, data: missingData } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test Medicine' }) // Missing expiryDate and quantity
  });
  
  if (missingFields?.status === 400 && missingData.message?.includes('required')) {
    printTest('Add Medicine Validation - Missing Fields', 'PASS', 'Correctly validated missing fields');
  } else {
    printTest('Add Medicine Validation - Missing Fields', 'FAIL', `Status: ${missingFields?.status}, Data: ${JSON.stringify(missingData)}`);
  }
  
  // Test invalid quantity
  const { response: invalidQty, data: invalidQtyData } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Test Medicine',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: -5 // Invalid quantity
    })
  });
  
  if (invalidQty?.status === 400 && invalidQtyData.message?.includes('quantity')) {
    printTest('Add Medicine Validation - Invalid Quantity', 'PASS', 'Correctly validated quantity');
    return true;
  } else {
    printTest('Add Medicine Validation - Invalid Quantity', 'FAIL', `Status: ${invalidQty?.status}, Data: ${JSON.stringify(invalidQtyData)}`);
    return false;
  }
}

async function testSearchByName() {
  printTest('Search by Name', '⏳', 'Testing medicine search by name');
  
  const token = await authenticateUser('recipient');
  
  // Add a medicine first
  const donorToken = await authenticateUser('donor');
  const { response: addRes, data: addData } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${donorToken}` },
    body: JSON.stringify(testMedicines.aspirin)
  });
  
  if (addRes?.status !== 201) {
    printTest('Search by Name - Add Medicine', 'FAIL', `Failed to add medicine: ${addRes?.status}`);
    return false;
  }
  
  // Search for the medicine
  const { response, data } = await makeRequest('/medicines/search?name=aspirin', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response?.status === 200 && data.medicines && data.medicines.length > 0) {
    const found = data.medicines.find(m => m.name.toLowerCase().includes('aspirin'));
    if (found) {
      printTest('Search by Name', 'PASS', `Found medicine: ${found.name}`);
      return true;
    }
  }
  
  printTest('Search by Name', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
  return false;
}

async function testSearchByCategory() {
  printTest('Search by Category', '⏳', 'Testing medicine search by category');
  
  const token = await authenticateUser('recipient');
  
  // Add a medicine first
  const donorToken = await authenticateUser('donor');
  const { response: addRes, data: addData } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${donorToken}` },
    body: JSON.stringify(testMedicines.paracetamol)
  });
  
  if (addRes?.status !== 201) {
    printTest('Search by Category - Add Medicine', 'FAIL', `Failed to add medicine: ${addRes?.status}`);
    return false;
  }
  
  const { response, data } = await makeRequest('/medicines/search?category=Pain', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response?.status === 200 && data.medicines) {
    const found = data.medicines.find(m => m.category.toLowerCase().includes('pain'));
    if (found) {
      printTest('Search by Category', 'PASS', `Found medicine in category: ${found.category}`);
      return true;
    }
  }
  
  printTest('Search by Category', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
  return false;
}

async function testSearchByExpiry() {
  printTest('Search by Expiry', '⏳', 'Testing medicine search by expiry date');
  
  const token = await authenticateUser('recipient');
  
  const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { response, data } = await makeRequest(`/medicines/search?expiryBefore=${futureDate}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response?.status === 200 && data.medicines) {
    printTest('Search by Expiry', 'PASS', `Found ${data.medicines.length} medicines expiring before ${futureDate}`);
    return true;
  }
  
  printTest('Search by Expiry', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
  return false;
}

async function testUpdateQuantity() {
  printTest('Update Quantity', '⏳', 'Testing medicine quantity update');
  
  if (!createdMedicines.paracetamol) {
    printTest('Update Quantity', 'FAIL', 'No medicine available for testing');
    return false;
  }
  
  const token = await authenticateUser('donor');
  
  const { response, data } = await makeRequest(`/medicines/update/${createdMedicines.paracetamol.id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ quantity: 75 })
  });
  
  if (response?.status === 200 && data.medicine && data.medicine.quantity === 75) {
    printTest('Update Quantity', 'PASS', `Quantity updated to ${data.medicine.quantity}`);
    return true;
  } else {
    printTest('Update Quantity', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testUpdateExpiry() {
  printTest('Update Expiry', '⏳', 'Testing medicine expiry date update');
  
  if (!createdMedicines.paracetamol) {
    printTest('Update Expiry', 'FAIL', 'No medicine available for testing');
    return false;
  }
  
  const token = await authenticateUser('donor');
  const newExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  
  const { response, data } = await makeRequest(`/medicines/update/${createdMedicines.paracetamol.id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ expiryDate: newExpiryDate })
  });
  
  if (response?.status === 200 && data.medicine) {
    const updatedExpiry = new Date(data.medicine.expiryDate).toISOString();
    if (updatedExpiry === newExpiryDate) {
      printTest('Update Expiry', 'PASS', `Expiry updated to ${updatedExpiry}`);
      return true;
    }
  }
  
  printTest('Update Expiry', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
  return false;
}

async function testUpdateStatus() {
  printTest('Update Status', '⏳', 'Testing medicine status update');
  
  if (!createdMedicines.paracetamol) {
    printTest('Update Status', 'FAIL', 'No medicine available for testing');
    return false;
  }
  
  const token = await authenticateUser('donor');
  
  const { response, data } = await makeRequest(`/medicines/update/${createdMedicines.paracetamol.id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status: 'CLAIMED' })
  });
  
  if (response?.status === 200 && data.medicine && data.medicine.status === 'CLAIMED') {
    printTest('Update Status', 'PASS', `Status updated to ${data.medicine.status}`);
    return true;
  } else {
    printTest('Update Status', 'FAIL', `Status: ${response?.status}, Data: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testAutoExpireLogic() {
  printTest('Auto-Expire Logic', '⏳', 'Testing automatic expiry of medicines');
  
  const token = await authenticateUser('donor');
  
  // Add an expired medicine
  const { response: addRes, data: addData } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(testMedicines.expired)
  });
  
  if (addRes?.status !== 201) {
    printTest('Auto-Expire Logic - Add Expired', 'FAIL', `Failed to add expired medicine: ${addRes?.status}`);
    return false;
  }
  
  // Get all medicines (this should trigger auto-expiry)
  const { response: getRes, data: getData } = await makeRequest('/medicines', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (getRes?.status === 200 && getData) {
    const expiredMedicine = getData.find(m => m.name === testMedicines.expired.name);
    if (!expiredMedicine) {
      printTest('Auto-Expire Logic', 'PASS', 'Expired medicine correctly excluded from results');
      return true;
    } else {
      printTest('Auto-Expire Logic', 'FAIL', 'Expired medicine still appears in results');
      return false;
    }
  }
  
  printTest('Auto-Expire Logic', 'FAIL', `Status: ${getRes?.status}, Data: ${JSON.stringify(getData)}`);
  return false;
}

async function testUnauthorizedAccess() {
  printTest('Unauthorized Access', '⏳', 'Testing unauthorized access to medicine endpoints');
  
  const token = await authenticateUser('recipient');
  
  // Try to add medicine as recipient (should fail)
  const { response: addRes, data: addData } = await makeRequest('/medicines/add', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(testMedicines.paracetamol)
  });
  
  if (addRes?.status === 403 && addData.message?.includes('Forbidden')) {
    printTest('Unauthorized Access - Add Medicine', 'PASS', 'Correctly rejected unauthorized add attempt');
  } else {
    printTest('Unauthorized Access - Add Medicine', 'FAIL', `Status: ${addRes?.status}, Data: ${JSON.stringify(addData)}`);
  }
  
  // Try to update medicine as recipient (should fail)
  if (createdMedicines.paracetamol) {
    const { response: updateRes, data: updateData } = await makeRequest(`/medicines/update/${createdMedicines.paracetamol.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ quantity: 100 })
    });
    
    if (updateRes?.status === 403 && updateData.message?.includes('Forbidden')) {
      printTest('Unauthorized Access - Update Medicine', 'PASS', 'Correctly rejected unauthorized update attempt');
      return true;
    } else {
      printTest('Unauthorized Access - Update Medicine', 'FAIL', `Status: ${updateRes?.status}, Data: ${JSON.stringify(updateData)}`);
      return false;
    }
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting MedShare Medicines Tests\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'Add Medicine', fn: testAddMedicine },
    { name: 'Add Medicine Validation', fn: testAddMedicineValidation },
    { name: 'Search by Name', fn: testSearchByName },
    { name: 'Search by Category', fn: testSearchByCategory },
    { name: 'Search by Expiry', fn: testSearchByExpiry },
    { name: 'Update Quantity', fn: testUpdateQuantity },
    { name: 'Update Expiry', fn: testUpdateExpiry },
    { name: 'Update Status', fn: testUpdateStatus },
    { name: 'Auto-Expire Logic', fn: testAutoExpireLogic },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess }
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
    console.log('\n🎉 All tests passed! Medicines module is working correctly.');
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

export { runAllTests, testUsers, testMedicines, createdMedicines };
