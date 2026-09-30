const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: false, trim: true, default: '' },
    passwordHash: { type: String, required: true },
    branch: { type: String, required: true, trim: true, maxlength: 100 },
    rank: { type: String, required: true, trim: true, maxlength: 100 },
    badgeId: { type: String, required: false, trim: true, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    emailOtp: { type: String, default: null },
    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },
    recentOtps: [
      {
        otp: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    resetOtp: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
    isPhoneVerified: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
