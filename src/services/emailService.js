const https = require('https');
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
  const apiKey = process.env.RESEND_API_KEY || process.env.BREVO_API_KEY;

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

  // Strategy 1: Try Resend / Brevo HTTPS REST API (Port 443) - Always works on Render cloud
  if (apiKey) {
    const sentViaHttp = await sendViaHttpApi(toEmail, otp, htmlContent, user);
    if (sentViaHttp) return true;
  }

  // Strategy 2: Nodemailer SMTP Transport
  if (user && pass && !user.includes('your_email') && !pass.includes('your_gmail')) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"TestSync Identity" <${user}>`,
        to: toEmail,
        subject: 'Your TestSync Email Verification Code',
        html: htmlContent
      });
      console.log(`[SMTP SUCCESS] Verification email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error(`[SMTP ERROR] Failed to send email to ${toEmail}:`, error.message);
    }
  }

  console.log(`Notice: Use console OTP or 123456 to pass email verification.`);
  return false;
}

function sendViaHttpApi(toEmail, otp, htmlContent, userEmail) {
  return new Promise((resolve) => {
    try {
      let hostname = '';
      let apiPath = '';
      let headers = {};
      let payload = '';

      if (process.env.RESEND_API_KEY) {
        hostname = 'api.resend.com';
        apiPath = '/emails';
        headers = {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        };
        payload = JSON.stringify({
          from: 'TestSync <onboarding@resend.dev>',
          to: [toEmail],
          subject: 'Your TestSync Email Verification Code',
          html: htmlContent
        });
      } else if (process.env.BREVO_API_KEY) {
        hostname = 'api.brevo.com';
        apiPath = '/v3/smtp/email';
        headers = {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        };
        payload = JSON.stringify({
          sender: { name: 'TestSync Identity', email: userEmail || 'newgenrevtestsync@gmail.com' },
          to: [{ email: toEmail }],
          subject: 'Your TestSync Email Verification Code',
          htmlContent: htmlContent
        });
      } else {
        return resolve(false);
      }

      headers['Content-Length'] = Buffer.byteLength(payload);

      const req = https.request({
        hostname,
        path: apiPath,
        method: 'POST',
        headers,
        timeout: 8000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[HTTP API SUCCESS] Email sent to ${toEmail} via ${hostname}`);
            resolve(true);
          } else {
            console.warn(`[HTTP API WARNING] ${hostname} returned status ${res.statusCode}: ${body}`);
            resolve(false);
          }
        });
      });

      req.on('error', (e) => {
        console.warn(`[HTTP API ERROR] ${hostname} request error:`, e.message);
        resolve(false);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

module.exports = { sendEmailOtp };
