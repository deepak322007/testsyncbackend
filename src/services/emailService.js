const nodemailer = require('nodemailer');

const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL for Port 465
  family: 4,    // Force IPv4 to prevent IPv6 ENETUNREACH timeouts on Render cloud
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: user,
    pass: pass
  }
});

/**
 * Startup SMTP connection verification
 */
function verifySmtpConnection() {
  if (!user || !pass || user.includes('your_email') || pass.includes('your_gmail')) {
    console.warn('[SMTP WARNING] EMAIL_USER or EMAIL_PASS not configured in environment variables.');
    return;
  }

  transporter.verify((error, success) => {
    if (error) {
      console.error('================================================');
      console.error('[SMTP VERIFICATION FAILED] Unable to connect to Gmail SMTP:');
      console.error(`- Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`- Command: ${error.command || 'N/A'}`);
      console.error(`- Response: ${error.response || 'N/A'}`);
      console.error(`- Message: ${error.message}`);
      console.error('================================================');
    } else {
      console.log('================================================');
      console.log(`[SMTP VERIFIED SUCCESS] Gmail SMTP authenticated for: ${user}`);
      console.log('================================================');
    }
  });
}

// Automatically verify SMTP on module initialization
verifySmtpConnection();

/**
 * Sends a 6-digit OTP verification email to the user's email address.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
async function sendEmailOtp(toEmail, otp) {
  console.log(`========================================`);
  console.log(`[EMAIL OTP GENERATED] To: ${toEmail} | Code: ${otp}`);
  console.log(`========================================`);

  if (!user || !pass) {
    console.warn('[SMTP WARNING] Skipping email dispatch: EMAIL_USER or EMAIL_PASS is missing.');
    return false;
  }

  const mailOptions = {
    from: `"TestSync Identity" <${user}>`,
    to: toEmail,
    subject: 'Your TestSync Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1E293B; max-width: 500px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h2 style="color: #2563EB; margin-bottom: 8px;">TestSync Email Verification</h2>
        <p style="color: #64748B; font-size: 14px;">Thank you for registering. Use the 6-digit OTP code below to verify your email address:</p>
        <div style="background: #F1F5F9; padding: 18px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F172A; text-align: center; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #94A3B8;">This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('------------------------------------------------');
    console.log(`[SMTP DISPATCH SUCCESS] Email sent to: ${toEmail}`);
    console.log(`- Message ID: ${info.messageId}`);
    console.log(`- Server Response: ${info.response}`);
    console.log('------------------------------------------------');
    return true;
  } catch (error) {
    console.error('================================================');
    console.error(`[SMTP DISPATCH ERROR] Failed to send email to ${toEmail}:`);
    console.error(`- Error Code: ${error.code || 'UNKNOWN'}`);
    console.error(`- Command: ${error.command || 'N/A'}`);
    console.error(`- SMTP Response: ${error.response || 'N/A'}`);
    console.error(`- Message: ${error.message}`);
    console.error('================================================');
    return false;
  }
}

module.exports = { sendEmailOtp, verifySmtpConnection };
