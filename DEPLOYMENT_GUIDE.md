# VELCUN Full Stack Deployment Guide

## Backend Deployment Steps

### 1. Configure Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

**Required Variables:**
```
MONGODB_URI=mongodb+srv://parvkarhana_db_user:rQ8Urr2fdToZp3I5@velcun.seswfju.mongodb.net/?appName=velcun
MONGODB_DB=velcun
JWT_SECRET=your-secure-random-secret-key-here
EMAIL_FROM=hello@velcun.com
EMAIL_TO=hello@velcun.com
VERCEL_URL=https://velcun.com
```

### 2. Install Backend Dependencies

```bash
cd /Users/parvkarhana/Desktop/VELCUN
npm install mongodb
```

### 3. Deploy Backend to Vercel

```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. Verify API Endpoints

Once deployed, test these endpoints:

- https://velcun.com/api/calculate-roi?fleetSize=25
- https://velcun.com/api/submit-contact (POST)
- https://velcun.com/api/submit-audit (POST)
- https://velcun.com/api/auth/register (POST)
- https://velcun.com/api/auth/login (POST)

## MongoDB Atlas Configuration

### IP Whitelist

Go to MongoDB Atlas → Network Access → IP Whitelist:
- Add: 0.0.0.0/0 (for Vercel dynamic IPs)
- OR: Add specific Vercel IP ranges

### Database Access

- Username: parvkarhana_db_user
- Database: velcun
- Permissions: Read/Write on all collections

## Testing the Full Stack

### 1. Test Frontend Forms

#### Quick Audit Form:
1. Go to https://velcun.com
2. Fill in fleet size and email
3. Submit
4. Check MongoDB for audit submission
5. Check email for notification

#### Contact Form:
1. Scroll to contact section
2. Fill in all steps
3. Submit
4. Check MongoDB for contact submission

### 2. Test ROI Calculator
- Use the per-truck ROI calculator
- Call the backend API for calculations
- Verify returns correct data

### 3. Test Authentication
- Register a new user via `/api/auth/register`
- Login via `/api/auth/login`
- Verify JWT token is returned

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: bad auth"**
- Verify MONGODB_URI is correct in Vercel
- Check MongoDB user credentials
- Ensure IP whitelist allows Vercel IPs

**Error: "MongoNetworkTimeout"**
- Check MongoDB Atlas cluster status
- Verify IP whitelist configuration
- Check internet connectivity

### API Returns 404
- Verify Vercel deployment completed
- Check API files are in `/api/` directory
- Ensure Vercel Functions are enabled

### Email Not Working
- Configure SendGrid/Mailgun in Vercel environment
- Add API key for email service
- Update `api/lib/email.js` with integration

## Security Checklist

Before production:

- [ ] Change JWT_SECRET to secure random string
- [ ] Enable MongoDB Atlas backup
- [ ] Set up MongoDB Atlas monitoring
- [ ] Configure Vercel environment variables
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Add rate limiting to API endpoints
- [ ] Implement CORS for frontend domain
- [ ] Review database user permissions
- [ ] Enable SSL/HTTPS (Vercel default)

## Production Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Database user has correct permissions
- [ ] IP whitelist configured
- [ ] Vercel environment variables set
- [ ] Backend deployed successfully
- [ ] Frontend connected to backend APIs
- [ ] Forms submit correctly
- [ ] Email notifications working
- [ ] ROI calculator working
- [ ] Authentication working
- [ ] Error handling in place
- [ ] Monitoring configured

## Performance Optimization

- Connection pooling configured
- Caching strategy considered
- CDN configuration (Vercel automatic)
- Image optimization (add if needed)
- Minification (add if needed)

## Monitoring

Set up monitoring for:
- API response times
- MongoDB performance
- Error rates
- Form submission rates
- User signups

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Check MongoDB Atlas logs
3. Verify environment variables
4. Test API endpoints individually
5. Check browser console for errors

Contact: hello@velcun.com
