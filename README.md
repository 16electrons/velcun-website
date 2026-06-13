# VELCUN Backend API

Full application backend for VELCUN built with Vercel Serverless Functions and MongoDB.

## Features

- Contact form submission with email notifications
- Fleet audit form with ROI calculations
- ROI calculator API
- User authentication (register/login)
- Pilot application workflow
- MongoDB integration
- Email automation

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name (default: velcun)
- `JWT_SECRET` - JWT secret key for authentication
- `EMAIL_FROM` - From email address
- `EMAIL_TO` - Destination email for notifications

### 3. Set up MongoDB

Create a free MongoDB Atlas account:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add to `.env` file

### 4. Configure Email Service (Optional)

For email notifications, integrate with:
- SendGrid (recommended)
- Mailgun
- AWS SES
- Or any SMTP service

Update the `api/lib/email.js` file with your email service configuration.

### 5. Run Locally

```bash
npm run dev
```

API will be available at `http://localhost:3000/api`

### 6. Deploy to Vercel

```bash
npm run deploy
```

## API Endpoints

### Contact Form
- **POST** `/api/submit-contact`
- Submit contact form
- Body: `{ name, email, phone, company, fleetSize, plan, notes }`

### Fleet Audit
- **POST** `/api/submit-audit`
- Submit fleet audit request
- Body: `{ fleetSize, email }`
- Returns ROI calculations

### ROI Calculator
- **GET** `/api/calculate-roi?fleetSize=25&plan=ecosystem&billing=monthly`
- Calculate ROI based on fleet size and plan
- Query params: `fleetSize`, `plan` (dispatch/ecosystem/enterprise), `billing` (monthly/annual)

### Authentication
- **POST** `/api/auth/register`
- Register new user
- Body: `{ email, password, name, company }`

- **POST** `/api/auth/login`
- Login user
- Body: `{ email, password }`
- Returns JWT token

### Pilot Application
- **POST** `/api/submit-pilot`
- Submit pilot application
- Body: `{ name, email, phone, company, fleetSize, truckTypes, currentTMS, currentELD, painPoints }`

## Database Collections

- `contacts` - Contact form submissions
- `audits` - Fleet audit requests with ROI data
- `users` - User accounts
- `pilots` - Pilot applications

## Security Notes

- For production, use bcrypt for password hashing (currently using SHA-256 for MVP)
- Use environment variables for all secrets
- Implement rate limiting for API endpoints
- Add CORS configuration if needed
- Use stronger JWT secrets in production

## Development

The API uses Vercel Serverless Functions which automatically scale based on traffic.

## Support

For issues or questions, contact hello@velcun.com
