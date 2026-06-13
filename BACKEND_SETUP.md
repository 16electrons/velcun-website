# VELCUN Backend - Quick Setup Guide

## What's Been Created

A complete full application backend for VELCUN using Vercel Serverless Functions.

## Directory Structure

```
/api
├── auth/
│   ├── login.js
│   └── register.js
├── lib/
│   ├── auth.js
│   ├── db.js
│   ├── email.js
│   └── schemas.js
├── calculate-roi.js
├── submit-audit.js
├── submit-contact.js
└── submit-pilot.js
```

## Quick Setup (5 minutes)

### 1. Install Node.js Dependencies

```bash
npm install mongodb
```

### 2. Set up MongoDB Atlas (Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (Free tier)
4. Create database user
5. Get connection string (SRV format)
6. Add to .env file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/velcun?retryWrites=true&w=majority
MONGODB_DB=velcun
```

### 3. Configure Environment Variables

```env
JWT_SECRET=your-secret-key-here
EMAIL_FROM=hello@velcun.com
EMAIL_TO=hello@velcun.com
```

### 4. Test the Backend

```bash
npm run dev
```

Test endpoints:
- http://localhost:3000/api/calculate-roi?fleetSize=25
- http://localhost:3000/api/submit-contact (POST)

### 5. Deploy to Vercel

```bash
vercel login
npm run deploy
```

## API Endpoints

### POST /api/submit-contact
Submit contact form
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-415-555-1234",
  "company": "Acme Trucking",
  "fleetSize": "25",
  "plan": "ecosystem",
  "notes": "Interested in pilot"
}
```

### POST /api/submit-audit
Calculate fleet savings
```json
{
  "fleetSize": "25",
  "email": "john@example.com"
}
```

### GET /api/calculate-roi
Calculate ROI
```
/api/calculate-roi?fleetSize=25&plan=ecosystem&billing=monthly
```

### POST /api/auth/register
Register user
```json
{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "Acme Trucking"
}
```

### POST /api/auth/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/submit-pilot
Submit pilot application
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-415-555-1234",
  "company": "Acme Trucking",
  "fleetSize": "25",
  "truckTypes": ["dry van", "reefer"],
  "currentTMS": "McLeod",
  "currentELD": "Samsara",
  "painPoints": ["settlement delays", "manual work"]
}
```

## Database Collections

After first use, MongoDB will automatically create:
- `contacts` - Contact form submissions
- `audits` - Fleet audit requests
- `users` - User accounts  
- `pilots` - Pilot applications

## Security Notes

⚠️ **Important for Production:**

1. Change JWT_SECRET to a strong random string
2. Use bcrypt for passwords (currently SHA-256 for MVP)
3. Add rate limiting
4. Implement CORS if needed
5. Never commit .env file

## Email Integration

To enable email notifications, update `api/lib/email.js`:
- Uncomment SendGrid code
- Add SENDGRID_API_KEY to .env
- Or integrate with Mailgun/AWS SES

## Frontend Integration

Update your frontend forms to call these APIs:

```javascript
// Example: Submit contact form
fetch('/api/submit-contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
```

## Troubleshooting

**MongoDB Connection Error:**
- Check MONGODB_URI in .env
- Ensure IP whitelist in MongoDB Atlas
- Verify database user permissions

**Vercel Deployment Issues:**
- Set environment variables in Vercel dashboard
- Check MongoDB Atlas IP whitelist (0.0.0.0/0 for testing)
- Verify Vercel project settings

## Next Steps

1. Set up MongoDB Atlas
2. Configure environment variables
3. Test endpoints locally
4. Deploy to Vercel
5. Integrate with frontend forms
6. Add email service integration
7. Set up monitoring/analytics

## Support

For issues, check the README.md or contact hello@velcun.com
