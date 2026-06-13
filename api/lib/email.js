// Email utility for Vercel Functions
// Supports SendGrid, Mailgun, or custom SMTP

async function sendEmail({ to, subject, html, text }) {
  // This is a placeholder implementation
  // Integrate with your email service (SendGrid, Mailgun, AWS SES, etc.)
  
  console.log('Email sent:', {
    to,
    subject,
    html,
    text,
  });

  // Example with SendGrid (uncomment and configure):
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to,
    from: process.env.EMAIL_FROM || 'hello@velcun.com',
    subject,
    html,
    text,
  };
  
  await sgMail.send(msg);
  */

  return true;
}

async function sendContactNotification(formData) {
  const subject = `New Contact Form Submission - ${formData.company}`;
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${formData.name}</p>
    <p><strong>Email:</strong> ${formData.email}</p>
    <p><strong>Phone:</strong> ${formData.phone}</p>
    <p><strong>Company:</strong> ${formData.company}</p>
    <p><strong>Fleet Size:</strong> ${formData.fleetSize}</p>
    <p><strong>Plan Interest:</strong> ${formData.plan}</p>
    <p><strong>Notes:</strong> ${formData.notes || 'None'}</p>
  `;

  await sendEmail({
    to: process.env.EMAIL_TO || 'hello@velcun.com',
    subject,
    html,
  });
}

async function sendAuditNotification(auditData) {
  const subject = `New Fleet Audit Request - ${auditData.fleetSize} trucks`;
  const html = `
    <h2>New Fleet Audit Request</h2>
    <p><strong>Fleet Size:</strong> ${auditData.fleetSize}</p>
    <p><strong>Email:</strong> ${auditData.email}</p>
    <p><strong>Calculated Monthly Savings:</strong> $${auditData.calculatedSavings?.toLocaleString()}</p>
    <p><strong>Estimated Annual Recovery:</strong> $${auditData.annualRecovery?.toLocaleString()}</p>
  `;

  await sendEmail({
    to: process.env.EMAIL_TO || 'hello@velcun.com',
    subject,
    html,
  });
}

async function sendPilotApplicationNotification(applicationData) {
  const subject = `New Pilot Application - ${applicationData.company}`;
  const html = `
    <h2>New Pilot Application</h2>
    <p><strong>Company:</strong> ${applicationData.company}</p>
    <p><strong>Contact:</strong> ${applicationData.name} (${applicationData.email})</p>
    <p><strong>Phone:</strong> ${applicationData.phone}</p>
    <p><strong>Fleet Size:</strong> ${applicationData.fleetSize} trucks</p>
    <p><strong>Truck Types:</strong> ${applicationData.truckTypes?.join(', ')}</p>
    <p><strong>Current TMS:</strong> ${applicationData.currentTMS}</p>
    <p><strong>Current ELD:</strong> ${applicationData.currentELD}</p>
    <p><strong>Pain Points:</strong> ${applicationData.painPoints?.join(', ')}</p>
  `;

  await sendEmail({
    to: process.env.EMAIL_TO || 'hello@velcun.com',
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
  sendContactNotification,
  sendAuditNotification,
  sendPilotApplicationNotification,
};