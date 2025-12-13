/* Test Gmail SMTP Connection */
import { sendEmail } from './backend/src/utils/email.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailConnection() {
  console.log('🧪 Testing Gmail SMTP Connection...\n');
  
  try {
    const result = await sendEmail(
      '12bavithra102004@gmail.com',
      'Test Connection - MedShare',
      '<h2>Connection Test</h2><p>This is a test email to verify Gmail SMTP connection.</p>'
    );
    
    if (result.success) {
      console.log('✅ Gmail SMTP connection successful!');
      console.log('📬 Message ID:', result.messageId);
      console.log('📧 Email sent to: 12bavithra102004@gmail.com');
    } else {
      console.log('❌ Gmail SMTP connection failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing email connection:', error.message);
  }
}

testEmailConnection();
