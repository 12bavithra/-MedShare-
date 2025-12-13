# Email Configuration for MedShare

## Ethereal Email Setup

The email notification system uses Ethereal Email (free test account) for sending emails.

### How it works:
1. When the server starts, it automatically creates a test Ethereal account
2. The email credentials are generated dynamically
3. All emails are sent to the Ethereal test inbox
4. Preview URLs are logged to the console for viewing emails

### No manual configuration required!

The email system is already configured and ready to use. When you start the server, you'll see:
- Email credentials being generated
- Preview URLs in the console for each email sent

### Email Events:
- **Medicine Donation**: Confirmation email to donor
- **Medicine Request**: Notification to both donor and recipient
- **Admin Approval**: Confirmation email to recipient
- **Admin Rejection**: Notification email to recipient

### Viewing Emails:
1. Start the server: `npm start`
2. Perform actions that trigger emails
3. Check console for "Preview URL" links
4. Click the links to view emails in Ethereal inbox

### Example Console Output:
```
📧 Email sent successfully!
Preview URL: https://ethereal.email/message/abc123...
```

No additional setup is required - the system is ready to use!
