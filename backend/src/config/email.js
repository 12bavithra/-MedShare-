import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create real SMTP transporter (Gmail, Outlook, etc.)
const createTransporter = async () => {
  try {
    // Check if real SMTP credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use real SMTP provider (Gmail, Outlook, etc.)
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Additional security for Gmail
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ Real SMTP connection verified');
      return transporter;
    } else {
      // Fallback to Ethereal for development/testing
      console.log('⚠️  No real SMTP credentials found, using Ethereal test account');
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      return transporter;
    }
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// Send email function
export const sendEmail = async (to, subject, message) => {
  try {
    const transporter = await createTransporter();
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"MedShare" <noreply@medshare.com>',
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #2b8a3e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">💙 MedShare</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Smart Medicine Sharing Platform</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="white-space: pre-line; line-height: 1.6; color: #333;">${message}</div>
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 14px; text-align: center; margin: 0;">
              This is an automated message from MedShare. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Check if using real SMTP or Ethereal
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Real email sent
      console.log(`📧 Email sent successfully to ${to}`);
      console.log(`📬 Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: to,
        deliveryMethod: 'real-smtp'
      };
    } else {
      // Ethereal test email
      console.log('📧 Email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        deliveryMethod: 'ethereal-test'
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default { sendEmail };