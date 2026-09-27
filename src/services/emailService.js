const nodemailer = require('nodemailer');

// Configure Email Transporter
// Supports Gmail SMTP, Outlook, SendGrid, or console logging for testing
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

/**
 * Sends a 6-digit OTP verification email to the user's email address.
 */
async function sendEmailOtp(toEmail, otp) {
  console.log(`========================================`);
  console.log(`[EMAIL OTP GENERATED] To: ${toEmail} | Code: ${otp}`);
  console.log(`========================================`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`Notice: EMAIL_USER or EMAIL_PASS not set in .env. OTP logged above for development.`);
    return true;
  }

  try {
    const mailOptions = {
      from: `"TestSync & CropCare" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your TestSync Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1E293B; max-width: 500px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px;">
          <h2 style="color: #2563EB; margin-bottom: 8px;">TestSync Email Verification</h2>
          <p style="color: #64748B; font-size: 14px;">Thank you for registering. Use the 6-digit OTP code below to verify your email address:</p>
          <div style="background: #F1F5F9; padding: 18px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F172A; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #94A3B8;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    return false;
  }
}

module.exports = { sendEmailOtp };
