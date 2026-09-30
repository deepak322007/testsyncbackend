const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP verification email to the user's email address.
 */
async function sendEmailOtp(toEmail, otp) {
  console.log(`========================================`);
  console.log(`[EMAIL OTP GENERATED] To: ${toEmail} | Code: ${otp}`);
  console.log(`========================================`);

  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';

  // Skip sending if credentials are not configured or using default placeholders
  if (!user || !pass || user.includes('your_email') || pass.includes('your_gmail')) {
    console.log(`Notice: Real SMTP credentials not configured in .env. Use console OTP or 123456.`);
    return true;
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

  // Attempt 1: Standard Gmail Service Transport
  try {
    const transporter1 = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    await transporter1.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${toEmail} via Gmail Service`);
    return true;
  } catch (err1) {
    console.warn('Gmail service transport failed, attempting fallback SMTP IPv4:', err1.message);
  }

  // Attempt 2: Direct IPv4 SMTP Transport Fallback (for Render Cloud environment)
  try {
    const transporter2 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      family: 4,
      auth: { user, pass }
    });
    await transporter2.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${toEmail} via IPv4 SMTP`);
    return true;
  } catch (err2) {
    console.error('Error sending verification email via all transports:', err2.message);
    return false;
  }
}

module.exports = { sendEmailOtp };
