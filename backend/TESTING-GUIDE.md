# MedShare Gmail SMTP Testing Guide

## 🎯 Complete Testing Process

### Step 1: Create .env File
Create a file named `.env` in your `backend` folder with this content:

```
# MedShare Backend Environment Variables

# Server Configuration
PORT=5000
CLIENT_ORIGIN=http://127.0.0.1:5500

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/medshare

# JWT Configuration
JWT_SECRET=dev-secret-change-me-in-production

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=12bavithra102004@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM="MedShare" <12bavithra102004@gmail.com>
```

**Replace `your-app-password-here` with your actual Gmail App Password**

### Step 2: Test Gmail SMTP Configuration
```bash
cd backend
node test-medshare-gmail.mjs
```

Expected output:
- ✅ Gmail SMTP configured!
- 🎉 SUCCESS! Real email sent to your Gmail inbox!

### Step 3: Test All Email Types
```bash
node test-all-email-types.mjs
```

This will test:
- Donor donation confirmation
- Medicine request notifications
- Admin approval/rejection notifications

### Step 4: Test Full Application Flow

1. **Start the server:**
   ```bash
   node src/server.js
   ```

2. **Open browser:** Go to `http://localhost:5000`

3. **Test complete flow:**
   - Register as DONOR with your Gmail
   - Add medicine → Check inbox for confirmation
   - Register as RECIPIENT with different email
   - Request medicine → Check both inboxes for notifications
   - Register as ADMIN
   - Approve/reject → Check recipient inbox

### Step 5: Verify Real Email Delivery

Check your Gmail inbox for:
- ✅ Professional HTML emails with MedShare branding
- ✅ Medicine details and timestamps
- ✅ Action-specific messages
- ✅ Real delivery (not preview URLs)

## 🎉 Success Indicators

When everything works correctly, you'll see:
- Console: `📧 Email sent successfully to recipient@gmail.com`
- Gmail inbox: Real MedShare emails with professional formatting
- All email notifications working for donor, recipient, and admin actions

## 🔧 Troubleshooting

If you encounter issues:
1. Verify your Gmail App Password is correct
2. Check that 2-factor authentication is enabled
3. Ensure the .env file is in the correct location
4. Check console logs for specific error messages
