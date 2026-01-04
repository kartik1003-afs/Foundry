# Email Notification Setup Guide

## Overview
The Foundry Lost & Found system now includes automatic email notifications when a lost item matches a found item.

## How It Works
1. When someone reports a **found item**, the system automatically searches for matching lost items
2. If high-confidence matches (score > 70%) are found, both parties receive email notifications
3. The person who lost the item gets an email with details of the found item
4. The person who found the item gets an email with details of the lost item

## Email Configuration

### 1. Set up Environment Variables
Add the following to your `.env` file in the `server/` directory:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password in the `EMAIL_PASS` environment variable

### 3. Alternative Email Services
You can use other email services by changing `EMAIL_SERVICE`:
- `gmail` (default)
- `outlook`
- `yahoo`
- `smtp` (for custom SMTP servers)

## Features

### Match Confidence Threshold
- Only matches with confidence score > 70% trigger email notifications
- This reduces false positives and spam

### Email Content
- **Lost Item Owner**: Receives found item details, location, and contact info
- **Found Item Owner**: Receives lost item details and safety guidelines
- Both emails include match confidence percentage and item images (if available)

### Safety Features
- Warning messages about verifying item ownership
- Tips for safe item exchanges
- Privacy protection (contact info only shared when high-confidence match exists)

## Testing

### Test Email Configuration
You can test the email service by running:

```javascript
const emailService = require('./server/services/emailService');
emailService.testConnection();
```

### Test Full Flow
1. Report a lost item with valid contact email
2. Report a similar found item with valid contact email
3. Check both email inboxes for match notifications

## Troubleshooting

### Common Issues
1. **Email not sending**: Check environment variables and app password
2. **No matches found**: Items may not be similar enough (confidence < 70%)
3. **Spam folder**: Check spam/junk folders for notifications

### Debug Logging
The system logs:
- Email sending attempts
- Match scores and decisions
- Any errors in the notification process

## Security Notes
- Store email credentials securely in environment variables
- Never commit `.env` files to version control
- Use app passwords instead of regular passwords for Gmail
- Consider using a dedicated email account for the service

## Next Steps
To use this feature:
1. Configure your email settings in `.env`
2. Ensure users provide valid email addresses when reporting items
3. Test with real lost and found reports
4. Monitor logs for any issues

The email notification system is now ready to automatically notify users when their lost items are found!
