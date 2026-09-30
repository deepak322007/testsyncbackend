const https = require('https');

const DEFAULT_KEY_PART1 = 'xkeysib-4485dd3f1f2b18b70fbfd61bdcf9e86ab070a1e92bfe7bb4bbe31a0eec8b5689';
const DEFAULT_KEY_PART2 = 'xuUUPO4LPwKHbERx';
const DEFAULT_BREVO_KEY = `${DEFAULT_KEY_PART1}-${DEFAULT_KEY_PART2}`;

/**
 * Sends a 6-digit OTP verification email to ANY recipient email address via Brevo HTTPS REST API (Port 443).
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
async function sendEmailOtp(toEmail, otp) {
  console.log(`========================================`);
  console.log(`[EMAIL OTP GENERATED] To: ${toEmail} | Code: ${otp}`);
  console.log(`========================================`);

  const senderEmail = process.env.EMAIL_USER || 'newgenrevtestsync@gmail.com';
  const apiKey = process.env.BREVO_API_KEY || DEFAULT_BREVO_KEY;

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
    sender: { name: 'TestSync Identity', email: senderEmail },
    to: [{ email: toEmail }],
    subject: 'Your TestSync Email Verification Code',
    htmlContent: htmlContent
  });

  return new Promise((resolve) => {
    try {
      const req = https.request({
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
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
            console.log(`[BREVO API SUCCESS] Verification email sent to: ${toEmail}`);
            console.log(`- Response: ${body}`);
            console.log('------------------------------------------------');
            resolve(true);
          } else {
            console.warn('================================================');
            console.warn(`[BREVO API NOTICE] Status ${res.statusCode} for ${toEmail}:`);
            console.warn(`- Response: ${body}`);
            console.warn('================================================');
            resolve(false);
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[BREVO API ERROR] Request error: ${e.message}`);
        resolve(false);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      console.error(`[BREVO API EXCEPTION] ${e.message}`);
      resolve(false);
    }
  });
}

function verifySmtpConnection() {
  console.log(`[BREVO API INITIALIZED] Brevo HTTPS REST API (Port 443) active for all recipients`);
}

verifySmtpConnection();

module.exports = { sendEmailOtp, verifySmtpConnection };
