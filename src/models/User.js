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
    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },
    isPhoneVerified: { type: Boolean, default: true },
    otpHash: { type: String, select: false },
    otpPurpose: { type: String, enum: ['signup', 'login'], select: false },
    otpExpiresAt: { type: Date, select: false },
    otpLastSentAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
