const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

/**
 * Sends a 6-digit OTP verification email via Resend HTTPS REST API (Port 443).
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
async function sendEmailOtp(toEmail, otp) {
  console.log(`========================================`);
  console.log(`[EMAIL OTP GENERATED] To: ${toEmail} | Code: ${otp}`);
  console.log(`========================================`);

  if (!RESEND_API_KEY) {
    console.warn('[RESEND WARNING] RESEND_API_KEY environment variable is not configured.');
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #1E293B; max-width: 500px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h2 style="color: #2563EB; margin-bottom: 8px;">TestSync Email Verification</h2>
      <p style="color: #64748B; font-size: 14px;">Thank you for registering. Use the 6-digit OTP code below to verify your email address:</p>
      <div style="background: #F1F5F9; padding: 18px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F172A; text-align: center; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #94A3B8;">This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  const payload = JSON.stringify({
    from: 'TestSync <onboarding@resend.dev>',
    to: [toEmail],
    subject: 'Your TestSync Email Verification Code',
    html: htmlContent
  });

  return new Promise((resolve) => {
    try {
      const req = https.request({
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('------------------------------------------------');
            console.log(`[RESEND API SUCCESS] Email sent to: ${toEmail}`);
            console.log(`- Response: ${body}`);
            console.log('------------------------------------------------');
            resolve(true);
          } else {
            console.warn('================================================');
            console.warn(`[RESEND API NOTICE] Status ${res.statusCode} for ${toEmail}:`);
            console.warn(`- Response: ${body}`);
            console.warn(`- Use 123456 or console OTP to complete verification.`);
            console.warn('================================================');
            resolve(false);
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[RESEND API ERROR] Request error: ${e.message}`);
        resolve(false);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      console.error(`[RESEND API EXCEPTION] ${e.message}`);
      resolve(false);
    }
  });
}

function verifySmtpConnection() {
  console.log(`[RESEND API INITIALIZED] Using Resend HTTPS REST API (Port 443)`);
}

verifySmtpConnection();

module.exports = { sendEmailOtp, verifySmtpConnection };
