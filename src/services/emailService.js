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

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4 to prevent Render cloud IPv6 ENETUNREACH timeouts
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      auth: { user, pass }
    });

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Verification email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`[SMTP ERROR] Failed to send email to ${toEmail}:`, error.message);
    return false;
  }
}

module.exports = { sendEmailOtp };
