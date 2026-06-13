// Database schemas for VELCUN collections

const contactFormSchema = {
  name: String,
  email: String,
  phone: String,
  company: String,
  fleetSize: String,
  plan: String,
  notes: String,
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'new' }, // new, contacted, qualified, converted
};

const auditFormSchema = {
  fleetSize: String,
  email: String,
  calculatedSavings: Number,
  annualRecovery: Number,
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
};

const pilotApplicationSchema = {
  name: String,
  email: String,
  phone: String,
  company: String,
  fleetSize: Number,
  truckTypes: [String], // dry van, reefer, flatbed, etc.
  currentTMS: String,
  currentELD: String,
  painPoints: [String],
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }, // pending, reviewing, approved, rejected
  decisionDate: Date,
};

const userSchema = {
  email: String,
  password: String, // hashed
  name: String,
  role: { type: String, default: 'user' }, // user, admin
  company: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
};

module.exports = {
  contactFormSchema,
  auditFormSchema,
  pilotApplicationSchema,
  userSchema,
};