// Quick Email Test - Individual Email Types
import { sendEmail } from './src/config/email.js';

// Test specific email types
async function testSpecificEmail(emailType) {
  const emailTests = {
    donor: {
      email: 'donor@example.com',
      subject: 'Medicine Donation Confirmation - MedShare',
      message: `Hello John Doe,

Thank you for donating medicine to MedShare!

Medicine Details:
• Name: Paracetamol 500mg
• Description: Pain relief tablets
• Quantity: 50
• Expiry Date: 12/31/2024

Your generous donation will help people in need.

Best regards,
MedShare Team`
    },
    request: {
      email: 'recipient@example.com',
      subject: 'Medicine Request Submitted - MedShare',
      message: `Hello Jane Smith,

Your medicine request has been submitted successfully!

Medicine Details:
• Name: Paracetamol 500mg
• Quantity: 50
• Donor: John Doe

Your request is now pending admin approval.

Best regards,
MedShare Team`
    },
    approval: {
      email: 'recipient@example.com',
      subject: 'Medicine Request Approved - MedShare',
      message: `Hello Jane Smith,

Great news! Your medicine request has been approved!

Medicine Details:
• Name: Paracetamol 500mg
• Quantity: 50

Please contact the donor to arrange pickup.

Best regards,
MedShare Team`
    }
  };

  const test = emailTests[emailType];
  if (!test) {
    console.log('❌ Invalid email type. Use: donor, request, or approval');
    return;
  }

  console.log(`🧪 Testing ${emailType} email...`);
  
  try {
    const result = await sendEmail(test.email, test.subject, test.message);
    
    if (result.success) {
      console.log(`✅ ${emailType} email sent successfully!`);
      console.log(`📧 Preview URL: ${result.previewUrl}`);
    } else {
      console.log(`❌ ${emailType} email failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ ${emailType} email error:`, error);
  }
}

// Get email type from command line argument
const emailType = process.argv[2] || 'donor';
testSpecificEmail(emailType);
