const crypto = require('crypto');
const https = require('https');

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendOtp(phone, otp, purpose) {
  const smsProvider = process.env.SMS_PROVIDER || (process.env.SMS_ENABLED === 'true' ? 'twilio' : 'console');

  console.log(`[OTP GENERATED:${purpose}] Mobile: ${phone} | Code: ${otp}`);

  // 1. MSG91 SMS Gateway (India Enterprise SMS)
  if (process.env.MSG91_AUTH_KEY || smsProvider === 'msg91') {
    try {
      const authKey = process.env.MSG91_AUTH_KEY || '575176A60vECz9xp6ab6a0e6P1';
      const templateId = process.env.MSG91_TEMPLATE_ID || '366979707362333339363137';
      const cleanNumber = phone.replace(/\D/g, '').slice(-10);

      const urlPath = `/api/v5/otp?template_id=${templateId}&mobile=91${cleanNumber}&otp=${otp}`;
      const postData = JSON.stringify({ otp: otp });

      const options = {
        hostname: 'control.msg91.com',
        path: urlPath,
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      await new Promise((resolve) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`[MSG91 Gateway] Status: ${res.statusCode} | Response: ${data}`);
            resolve(data);
          });
        });
        req.on('error', (e) => {
          console.error(`[MSG91 Network Error] ${e.message}`);
          resolve(null);
        });
        req.write(postData);
        req.end();
      });
      return;
    } catch (err) {
      console.error(`[MSG91 Exception] ${err.message}`);
    }
  }

  // 2. Fast2SMS (Indian Mobile SMS Provider)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const apiKey = process.env.FAST2SMS_API_KEY;
      const cleanNumber = phone.replace(/\D/g, '').slice(-10);

      const postData = JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: cleanNumber
      });

      const options = {
        hostname: 'www.fast2sms.com',
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      await new Promise((resolve) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`[Fast2SMS Sent] ${data}`);
            resolve(data);
          });
        });
        req.on('error', (e) => resolve(null));
        req.write(postData);
        req.end();
      });
      return;
    } catch (err) {
      console.error(`[Fast2SMS Error] ${err.message}`);
    }
  }

  // 3. Twilio (Global SMS Provider)
  if (smsProvider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your CropCare ${purpose} verification OTP is ${otp}. Expires in 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      console.log(`[Twilio SMS Sent] Delivered OTP to ${phone}`);
      return;
    } catch (err) {
      console.error(`[Twilio Error] ${err.message}`);
    }
  }
}

module.exports = { createOtp, hashOtp, sendOtp };
