/* Quick Email Test Script for MedShare */
import { sendEmail, emailTemplates } from './backend/src/utils/email.js';
import dotenv from 'dotenv';

dotenv.config();

async function quickEmailTest() {
  console.log('🧪 Quick Email Test for MedShare\n');
  
  // Replace with your real email address for testing
  const testEmail = 'your-email@example.com'; // CHANGE THIS TO YOUR EMAIL
  
  if (testEmail === 'your-email@example.com') {
    console.log('❌ Please edit this script and replace "your-email@example.com" with your real email address');
    console.log('   Then run: node quick-email-test.mjs');
    return;
  }

  try {
    console.log('📧 Testing donation confirmation email...');
    const donationHtml = emailTemplates.donationConfirmation(
      'Test User',
      'Paracetamol 500mg',
      50,
      '12/31/2025'
    );
    
    const result1 = await sendEmail(
      testEmail,
      'Test: Donation Successful - MedShare',
      donationHtml
    );
    
    console.log(result1.success ? '✅ Donation email sent' : '❌ Failed');
    
    console.log('\n📧 Testing request notification email...');
    const requestHtml = emailTemplates.requestNotification(
      'Test Recipient',
      'Test Donor',
      'Paracetamol 500mg',
      25
    );
    
    const result2 = await sendEmail(
      testEmail,
      'Test: Request Submitted - MedShare',
      requestHtml
    );
    
    console.log(result2.success ? '✅ Request email sent' : '❌ Failed');
    
    console.log('\n📧 Testing approval notification email...');
    const approvalHtml = emailTemplates.approvalNotification(
      'Test Recipient',
      'Paracetamol 500mg',
      25,
      'approved'
    );
    
    const result3 = await sendEmail(
      testEmail,
      'Test: Request Approved - MedShare',
      approvalHtml
    );
    
    console.log(result3.success ? '✅ Approval email sent' : '❌ Failed');
    
    console.log('\n🎉 Email test completed!');
    console.log('📬 Check your Gmail inbox for the test emails.');
    console.log('📧 Emails sent from: 12bavithra102004@gmail.com');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

quickEmailTest();
