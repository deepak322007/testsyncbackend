const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { sendEmailOtp } = require('../services/emailService');
const { createOtp, hashOtp, sendOtp } = require('../services/otpService');

const router = express.Router();
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'cropcare-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    branch: user.branch,
    rank: user.rank,
    badgeId: user.badgeId || '',
    isEmailVerified: user.isEmailVerified || false,
    isPhoneVerified: user.isPhoneVerified || false
  };
}

function generateNumericOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, branch, rank, badgeId, operatorId } = req.body;
    const phone = req.body.phone && String(req.body.phone).trim().length > 0
      ? String(req.body.phone).trim()
      : 'phone_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

    if (!name || !email || typeof password !== 'string' || password.length < 6 || !branch || !rank) {
      return res.status(400).json({
        message: 'Name, email, branch, rank, and a password of at least 6 characters are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isEmailVerified) {
      return res.status(409).json({ message: 'An account with this email address already exists' });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 12);
    const assignedBadge = (badgeId || operatorId || '').trim();

    const otp = generateNumericOtp();
    const emailOtpHash = await bcrypt.hash(otp, 10);
    const emailOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    let user = existingUser;
    if (!user) {
      user = new User({
        name: String(name).trim(),
        email: normalizedEmail,
        phone,
        passwordHash,
        branch: String(branch).trim(),
        rank: String(rank).trim(),
        badgeId: assignedBadge,
        isEmailVerified: false,
        emailOtpHash,
        emailOtpExpiresAt,
        isPhoneVerified: true
      });
    } else {
      user.name = String(name).trim();
      user.passwordHash = passwordHash;
      user.branch = String(branch).trim();
      user.rank = String(rank).trim();
      user.badgeId = assignedBadge;
      user.emailOtpHash = emailOtpHash;
      user.emailOtpExpiresAt = emailOtpExpiresAt;
      user.isEmailVerified = false;
    }

    await user.save();
    await sendEmailOtp(normalizedEmail, otp);

    return res.status(201).json({
      message: `Verification OTP code (${otp}) sent to your email address`,
      email: normalizedEmail,
      requiresEmailVerification: true,
      devOtp: otp
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email address already exists' });
    }
    return next(error);
  }
});

router.post('/verify-email-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const cleanOtp = String(otp).trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No registration pending for this email' });
    }

    if (user.isEmailVerified) {
      return res.json({
        message: 'Email address already verified!',
        token: createToken(user),
        user: publicUser(user)
      });
    }

    // Master Dev OTP check or bcrypt hash comparison
    const isMasterOtp = cleanOtp === '123456' || cleanOtp === '000000';
    const isHashMatch = user.emailOtpHash ? await bcrypt.compare(cleanOtp, user.emailOtpHash) : false;

    if (!isMasterOtp && !isHashMatch) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check your email or use 123456' });
    }

    if (!isMasterOtp && user.emailOtpExpiresAt && user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new code' });
    }

    user.isEmailVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    await user.save();

    return res.json({
      message: 'Email address verified successfully!',
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/resend-email-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = generateNumericOtp();
    user.emailOtpHash = await bcrypt.hash(otp, 10);
    user.emailOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendEmailOtp(normalizedEmail, otp);
    return res.json({
      message: `A new OTP code (${otp}) has been sent to your email address`,
      devOtp: otp
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || String(email).trim().length === 0) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    if (!password || String(password).trim().length === 0) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'No account found with this email' });
    }

    const isMatch = await bcrypt.compare(String(password).trim(), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (!user.isEmailVerified) {
      const otp = generateNumericOtp();
      user.emailOtpHash = await bcrypt.hash(otp, 10);
      user.emailOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      await sendEmailOtp(normalizedEmail, otp);

      return res.status(403).json({
        message: `Your email is not verified. An OTP code (${otp}) was sent to your email.`,
        requiresEmailVerification: true,
        email: normalizedEmail,
        devOtp: otp
      });
    }

    return res.json({
      message: 'Login successful',
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
