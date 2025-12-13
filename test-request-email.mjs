import dotenv from 'dotenv';
import { sendEmail, emailTemplates } from './src/utils/email.js';

dotenv.config();

async function testRequestEmail() {
  console.log('🧪 Testing request email notifications...');
  
  try {
    // Test recipient notification
    const recipientHtmlMessage = emailTemplates.requestNotification(
      'Test Recipient',
      'Test Donor',
      'Test Medicine',
      10
    );

    const recipientResult = await sendEmail(
      'test@example.com', // Replace with your email for testing
      'Test Request Notification - MedShare',
      recipientHtmlMessage
    );

    console.log('Recipient email result:', recipientResult);

    // Test donor notification
    const donorHtmlMessage = emailTemplates.donorRequestNotification(
      'Test Donor',
      'Test Recipient',
      'Test Medicine',
      10
    );

    const donorResult = await sendEmail(
      'test@example.com', // Replace with your email for testing
      'Test Donor Notification - MedShare',
      donorHtmlMessage
    );

    console.log('Donor email result:', donorResult);

  } catch (error) {
    console.error('Email test failed:', error);
  }
}

testRequestEmail();
