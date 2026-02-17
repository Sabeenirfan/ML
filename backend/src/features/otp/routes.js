const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const OTP = require('../../models/OTP');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../shared/emailService');

const router = express.Router();

// Rate limiting map (in-memory, use Redis in production)
const rateLimitMap = new Map();

// Helper: Check rate limit
const checkRateLimit = (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000 / 60);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
};

// Helper: Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper: Validate if it's a Gmail address
const isGmailAddress = (email) => {
  return email.toLowerCase().endsWith('@gmail.com');
};

// Helper: Validate password strength
const isStrongPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
};

// ============================================
// 1. SIGNUP - Step 1: Request OTP
// ============================================
router.post('/signup/request-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if it's a Gmail address
    if (!isGmailAddress(normalizedEmail)) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed for registration' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
      });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`signup:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: `Too many OTP requests. Please try again in ${rateLimit.resetIn} minutes`
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: 'Email already registered and verified' });
    }

    if (existingUser && !existingUser.isEmailVerified) {
      console.log(`[Signup] Resending OTP for unverified user: ${normalizedEmail}`);
    }

    // Generate and save OTP
    const otpDoc = await OTP.createOTP(normalizedEmail, 'email_verification', 1);

    // Send email - MUST succeed
    try {
      await sendVerificationEmail(normalizedEmail, otpDoc.otp, 1);
      console.log(`✅ OTP sent to ${normalizedEmail}: ${otpDoc.otp}`);

      res.json({
        message: 'OTP sent to your email. Please verify within 1 minute',
        email: normalizedEmail,
        expiresIn: 1 * 60, // seconds
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);

      await otpDoc.deleteOne();

      if (emailError.message.includes('authentication failed') || emailError.message.includes('Invalid email credentials')) {
        return res.status(500).json({
          message: 'Email service authentication failed. Please contact support.'
        });
      } else if (emailError.message.includes('connect to email server')) {
        return res.status(500).json({
          message: 'Unable to connect to email server. Please try again later.'
        });
      } else {
        return res.status(500).json({
          message: 'Failed to send verification email. Please try again.'
        });
      }
    }
  } catch (error) {
    console.error('[Signup Request OTP] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 2. SIGNUP - Step 2: Verify OTP and Create Account
// ============================================
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpVerification = await OTP.verifyOTP(normalizedEmail, otp, 'email_verification');

    if (!otpVerification.success) {
      return res.status(400).json({
        message: otpVerification.message,
        attemptsRemaining: otpVerification.attemptsRemaining
      });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password with bcryptjs (legacy fix: standardized from bcrypt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user && !user.isEmailVerified) {
      user.name = name;
      user.password = hashedPassword;
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User registered successfully: ${normalizedEmail}`);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('[Signup Verify OTP] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 3. RESEND OTP (for signup or password reset)
// ============================================
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ message: 'Email and purpose are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!['email_verification', 'password_reset'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid purpose' });
    }

    const rateLimit = checkRateLimit(`resend:${normalizedEmail}:${purpose}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: `Too many OTP requests. Please try again in ${rateLimit.resetIn} minutes`
      });
    }

    const otpDoc = await OTP.createOTP(normalizedEmail, purpose, 1);

    try {
      if (purpose === 'email_verification') {
        await sendVerificationEmail(normalizedEmail, otpDoc.otp, 1);
      } else {
        await sendPasswordResetEmail(normalizedEmail, otpDoc.otp, 1);
      }
      console.log(`✅ OTP resent to ${normalizedEmail}: ${otpDoc.otp}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
    }

    res.json({
      message: 'OTP sent successfully',
      expiresIn: 1 * 60,
    });
  } catch (error) {
    console.error('[Resend OTP] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 4. LOGIN - Check email verification
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const rateLimit = checkRateLimit(`login:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: `Too many login attempts. Please try again in ${rateLimit.resetIn} minutes`
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: 'This account has been deleted' });
    }

    if (!user.isEmailVerified) {
      const otpDoc = await OTP.createOTP(normalizedEmail, 'email_verification', 10);
      try {
        await sendVerificationEmail(normalizedEmail, otpDoc.otp, 10);
        console.log(`✅ Verification OTP sent to unverified user: ${normalizedEmail}`);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
      }

      return res.status(403).json({
        message: 'Email not verified. A new verification OTP has been sent to your email',
        requiresVerification: true,
        email: normalizedEmail
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in successfully: ${normalizedEmail}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 5. FORGOT PASSWORD - Step 1: Request OTP
// ============================================
router.post('/forgot-password/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const rateLimit = checkRateLimit(`forgot:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: `Too many password reset requests. Please try again in ${rateLimit.resetIn} minutes`
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        message: 'This account has been deleted. Please contact support.'
      });
    }

    const otpDoc = await OTP.createOTP(normalizedEmail, 'password_reset', 1);

    try {
      await sendPasswordResetEmail(normalizedEmail, otpDoc.otp, 1);
      console.log(`✅ Password reset OTP sent to ${normalizedEmail}: ${otpDoc.otp}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
    }

    res.json({
      message: 'Password reset OTP sent to your email',
      expiresIn: 1 * 60,
    });
  } catch (error) {
    console.error('[Forgot Password Request] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 6. FORGOT PASSWORD - Step 2: Verify OTP
// ============================================
router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpVerification = await OTP.verifyOTP(normalizedEmail, otp, 'password_reset');

    if (!otpVerification.success) {
      return res.status(400).json({
        message: otpVerification.message,
        attemptsRemaining: otpVerification.attemptsRemaining
      });
    }

    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'OTP verified. You can now reset your password',
      resetToken,
    });
  } catch (error) {
    console.error('[Forgot Password Verify OTP] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 7. RESET PASSWORD - Final Step
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: 'This account has been deleted' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    console.log(`✅ Password reset successfully for: ${user.email}`);

    res.json({
      message: 'Password reset successfully. You can now login with your new password',
    });
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
