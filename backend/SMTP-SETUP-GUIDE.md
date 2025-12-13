# MedShare Real SMTP Setup Guide

## 🎯 Overview
This guide helps you configure MedShare to send real emails using popular SMTP providers instead of test accounts.

## 📧 Supported Providers
- **Gmail** (Recommended)
- **Outlook/Hotmail**
- **Yahoo Mail**
- **Custom SMTP servers**

## 🔧 Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"
3. Follow the setup process

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other" as the device
4. Enter "MedShare" as the device name
5. Copy the generated 16-character password

### Step 3: Configure .env File
Add these lines to your `backend/.env` file:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM="MedShare" <your-gmail@gmail.com>
```

## 📧 Outlook/Hotmail Setup

### Step 1: Enable 2-Factor Authentication
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable "Two-step verification"

### Step 2: Generate App Password
1. Go to [App Passwords](https://account.microsoft.com/security)
2. Create a new app password
3. Name it "MedShare"
4. Copy the generated password

### Step 3: Configure .env File
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-app-password
EMAIL_FROM="MedShare" <your-email@outlook.com>
```

## 📧 Yahoo Mail Setup

### Step 1: Enable 2-Factor Authentication
1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Enable "Two-step verification"

### Step 2: Generate App Password
1. Go to [App Passwords](https://login.yahoo.com/account/security)
2. Generate an app password
3. Name it "MedShare"
4. Copy the generated password

### Step 3: Configure .env File
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_FROM="MedShare" <your-email@yahoo.com>
```

## 🧪 Testing Your Configuration

### Method 1: Test Script
```bash
cd backend
node test-real-smtp.mjs
```

### Method 2: Test with Real Email
1. Set `TEST_EMAIL=your-real-email@gmail.com` in .env
2. Run the test script
3. Check your inbox for the test email

### Method 3: Test Full Application
1. Start your server: `node src/server.js`
2. Register a new user with your real email
3. Check your inbox for the confirmation email

## 🔍 Troubleshooting

### Common Issues:
1. **"Invalid credentials"** - Check your app password
2. **"Connection timeout"** - Verify SMTP host and port
3. **"Authentication failed"** - Ensure 2FA is enabled
4. **"Less secure app access"** - Use app passwords, not regular passwords

### Debug Steps:
1. Check your .env file has correct credentials
2. Verify 2-factor authentication is enabled
3. Confirm app password is correct
4. Test with the provided test script

## 📋 Email Notifications in MedShare

The following events will send real emails:
- ✅ **Donor Donation**: Confirmation email to donor
- ✅ **Medicine Request**: Notification to both donor and recipient
- ✅ **Admin Approval**: Notification to recipient
- ✅ **Admin Rejection**: Notification to recipient

## 🎉 Success Indicators

When configured correctly, you'll see:
- `✅ Real SMTP connection verified` in console
- `📧 Email sent successfully to recipient@email.com` in console
- Real emails arrive in your inbox (not just preview URLs)

## 🔒 Security Notes

- Never commit your .env file to version control
- Use app passwords, not regular passwords
- Keep your SMTP credentials secure
- Consider using environment-specific configurations
