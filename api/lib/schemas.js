// Database schemas for VELCUN collections

// Core business schemas
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

// 5 Automation Layer Schemas

// Autonomous Settlement (Settle)
const settlementSchema = {
  fleetId: String,
  loadId: String,
  invoiceNumber: String,
  carrier: String,
  shipper: String,
  amount: Number,
  dueDate: Date,
  invoiceDate: Date,
  status: { type: String, default: 'pending' }, // pending, processing, validated, paid, rejected
  documents: [Object],
  ediData: Object,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paymentDate: Date,
  paymentMethod: String,
  processingLog: [Object],
};

// Predictive Lane Optimization (Lane IQ)
const laneSchema = {
  fleetId: String,
  origin: String,
  destination: String,
  weight: Number,
  equipment: String,
  loadType: String,
  currentRate: Number,
  proposedRate: Number,
  distance: Number,
  estimatedDeadhead: Number,
  ratePerMile: Number,
  profitMargin: Number,
  profitMarginPercent: Number,
  projectedMargin: Number,
  estimatedFuelCost: Number,
  attractivenessScore: Number,
  demandLevel: String, // high, medium, low
  recommendation: String,
  status: { type: String, default: 'pending' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  actualMargin: Number,
};

// Unstructured Data Ingestion (Parse)
const documentSchema = {
  fleetId: String,
  documentType: String, // invoice, bill_of_lading, rate_confirmation, email, load_board_post, tms_export
  source: String, // email, upload, API
  rawContent: String,
  fileName: String,
  metadata: Object,
  priority: { type: String, default: 'normal' }, // low, normal, high, urgent
  parsedData: Object,
  status: { type: String, default: 'processed' }, // pending, processing, processed, failed
  confidence: Number,
  extractionDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  processingLog: [Object],
  notes: String,
};

// Driver-First Retention (Driver Yield)
const driverSchema = {
  fleetId: String,
  driverId: String,
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  hireDate: Date,
  equipment: String,
  currentRoute: String,
  status: { type: String, default: 'active' }, // active, warning, probation, inactive, terminated
  performanceMetrics: {
    onTimeDeliveryPercent: Number,
    safetyScore: Number,
    customerSatisfaction: Number,
    loadCount: Number,
    avgHomeTime: Number,
    homeTimeSatisfaction: Number,
  },
  availability: {
    availableDate: Date,
    preferredRoutes: [String],
    homeTimePreference: String,
  },
  preferences: {
    routePreferences: [String],
    equipmentPreferences: [String],
    homeTimePreference: String,
  },
  retentionScore: Number,
  riskLevel: String, // low, medium, high
  productivityScore: Number,
  satisfactionScore: Number,
  overallDriverYield: Number,
  recommendations: [Object],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  notes: String,
};

// Border Compliance
const borderShipmentSchema = {
  fleetId: String,
  shipmentId: String,
  origin: String,
  destination: String,
  originCountry: String,
  destinationCountry: String,
  equipment: String,
  cargoType: String,
  carrier: String,
  scheduledDate: Date,
  actualBorderCrossingTime: Date,
  checkpoint: String,
  status: { type: String, default: 'pending' }, // pending, awaiting_documents, approved, rejected, in_transit, cleared
  documents: [Object],
  complianceChecklist: Object,
  customsValue: Number,
  hazmat: Boolean,
  temperatureControl: Boolean,
  weight: Number,
  score: Number,
  approved: Boolean,
  requiredDocuments: [String],
  missingDocuments: [String],
  flaggedIssues: [String],
  documentsRequested: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  complianceLog: [Object],
};

module.exports = {
  contactFormSchema,
  auditFormSchema,
  pilotApplicationSchema,
  userSchema,
  settlementSchema,
  laneSchema,
  documentSchema,
  driverSchema,
  borderShipmentSchema,
};