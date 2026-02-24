/**
 * Email Service Utility
 * =======================
 * Sends transactional emails for booking events.
 * Uses nodemailer with Gmail SMTP (configure in .env).
 * All methods are async and called non-blocking (fire-and-forget) from controllers.
 *
 * To enable: set EMAIL_USER and EMAIL_PASS in .env
 * Gmail: generate an App Password at https://myaccount.google.com/apppasswords
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// Check if email is configured
const isEmailConfigured = () =>
  !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// ── Shared HTML template wrapper ─────────────────────────────────────────────
const htmlTemplate = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 24px; max-width: 500px; margin: auto; }
    h2   { color: #1a73e8; }
    .detail { background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 12px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #888; }
    .badge-confirmed { color: #1e7e34; font-weight: bold; }
    .badge-pending   { color: #856404; font-weight: bold; }
    .badge-cancelled { color: #721c24; font-weight: bold; }
    .badge-rejected  { color: #721c24; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Campus Facility Booking System</h2>
    <h3>${title}</h3>
    ${body}
    <div class="footer">
      This is an automated message. Please do not reply to this email.<br/>
      &copy; ${new Date().getFullYear()} Campus Booking System
    </div>
  </div>
</body>
</html>
`;

// ── Email methods ─────────────────────────────────────────────────────────────

/**
 * Send booking confirmation / submission email.
 */
const sendBookingConfirmation = async ({ to, userName, facilityName, date, start_time, end_time, status, bookingId }) => {
  if (!isEmailConfigured()) return;

  const statusLabel = status === 'confirmed'
    ? '<span class="badge-confirmed">✅ Confirmed</span>'
    : '<span class="badge-pending">⏳ Pending Approval</span>';

  const transporter = createTransporter();
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: `Booking #${bookingId} – ${status === 'confirmed' ? 'Confirmed' : 'Submitted'} | ${facilityName}`,
    html: htmlTemplate(
      status === 'confirmed' ? 'Booking Confirmed!' : 'Booking Submitted',
      `
      <p>Hi ${userName},</p>
      <p>Your booking has been ${status === 'confirmed' ? '<strong>confirmed</strong>' : 'submitted and is awaiting admin approval'}.</p>
      <div class="detail">
        <strong>Booking ID:</strong> #${bookingId}<br/>
        <strong>Facility:</strong>   ${facilityName}<br/>
        <strong>Date:</strong>       ${date}<br/>
        <strong>Time:</strong>       ${start_time} – ${end_time}<br/>
        <strong>Status:</strong>     ${statusLabel}
      </div>
      `
    ),
  });
};

/**
 * Send status-change notification (approved / rejected / completed).
 */
const sendStatusUpdate = async ({ to, userName, facilityName, status, admin_notes, bookingId }) => {
  if (!isEmailConfigured()) return;

  const badge = `<span class="badge-${status}">${status.toUpperCase()}</span>`;
  const transporter = createTransporter();
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: `Booking #${bookingId} Status Updated: ${status.toUpperCase()} | ${facilityName}`,
    html: htmlTemplate(
      `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `
      <p>Hi ${userName},</p>
      <p>Your booking #${bookingId} for <strong>${facilityName}</strong> has been updated.</p>
      <div class="detail">
        <strong>New Status:</strong> ${badge}<br/>
        ${admin_notes ? `<strong>Admin Notes:</strong> ${admin_notes}` : ''}
      </div>
      `
    ),
  });
};

/**
 * Send cancellation notice.
 */
const sendCancellationNotice = async ({ to, userName, facilityName, date, start_time, bookingId }) => {
  if (!isEmailConfigured()) return;

  const transporter = createTransporter();
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: `Booking #${bookingId} Cancelled | ${facilityName}`,
    html: htmlTemplate(
      'Booking Cancelled',
      `
      <p>Hi ${userName},</p>
      <p>Your booking has been <strong>cancelled</strong>.</p>
      <div class="detail">
        <strong>Booking ID:</strong> #${bookingId}<br/>
        <strong>Facility:</strong>   ${facilityName}<br/>
        <strong>Date:</strong>       ${date}<br/>
        <strong>Start:</strong>      ${start_time}<br/>
        <strong>Status:</strong>     <span class="badge-cancelled">CANCELLED</span>
      </div>
      `
    ),
  });
};

module.exports = { sendBookingConfirmation, sendStatusUpdate, sendCancellationNotice };
