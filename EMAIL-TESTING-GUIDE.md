# 📧 MedShare Email Testing Guide

## 🎯 **Testing Email Notifications**

### **Step 1: Manual Testing Through Web Interface**

1. **Open your browser** and go to: `http://localhost:5000`

2. **Register Test Users** (use real email addresses):
   - **Donor**: Register with role "DONOR" using your real email
   - **Recipient**: Register with role "RECIPIENT" using another real email
   - **Admin**: Register with role "ADMIN" using a third real email

3. **Test Email Workflow**:

   **A. Donation Email Test:**
   - Login as DONOR
   - Go to "Donate" page
   - Add a medicine (e.g., "Paracetamol 500mg", quantity: 50, expiry: 12/31/2025)
   - **Check your email** - you should receive a "Donation Successful" email

   **B. Request Email Test:**
   - Login as RECIPIENT
   - Go to "Browse Medicines" page
   - Request the medicine you just donated
   - **Check both emails**:
     - Donor should receive "Someone Requested Your Donation" email
     - Recipient should receive "Request Submitted" email

   **C. Approval Email Test:**
   - Login as ADMIN
   - Go to Admin Dashboard
   - Find the pending request and approve it
   - **Check recipient's email** - should receive "Request Approved" email

### **Step 2: Check Server Console Logs**

When emails are sent, you should see these logs in your terminal:
```
✅ Email sent to donor@example.com
📬 Message ID: <message-id@gmail.com>
✅ Email sent to recipient@example.com
📬 Message ID: <message-id@gmail.com>
```

### **Step 3: Verify Gmail Delivery**

1. **Check Gmail Inbox** for emails from: `12bavithra102004@gmail.com`
2. **Check Spam Folder** if emails don't appear in inbox
3. **Email should have**:
   - Subject: "Donation Successful - MedShare" / "Request Submitted - MedShare" / etc.
   - Professional HTML formatting with MedShare branding
   - Medicine details (name, quantity, expiry date)

### **Step 4: Automated Testing**

Run the automated test suite to verify all functionality:
```bash
cd backend
npm run test:complete
```

This will test the complete workflow and send real emails.

## 🔍 **Troubleshooting**

### **If emails are not received:**
1. Check server console for error messages
2. Verify Gmail SMTP credentials in `backend.env`
3. Check Gmail spam folder
4. Ensure Gmail app password is correct

### **If server errors occur:**
1. Check MongoDB connection
2. Verify all dependencies are installed
3. Check port 5000 is not in use

## 📱 **Email Templates Tested**

- ✅ **Donation Confirmation**: Sent to donors
- ✅ **Request Notification**: Sent to recipients
- ✅ **Donor Request Alert**: Sent to donors when medicine is requested
- ✅ **Approval Notification**: Sent to recipients when approved/rejected

## 🎉 **Success Indicators**

- Server console shows "✅ Email sent to [email]"
- Gmail inbox receives professional HTML emails
- Email contains correct medicine details
- No JavaScript errors in browser console
- All workflow steps complete successfully
