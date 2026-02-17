const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const OTP = require("../../models/OTP");
const RecommendationCache = require("../../models/RecommendationCache");
const auth = require("../../middleware/auth");
const { sendVerificationEmail } = require("../../shared/emailService");

const router = express.Router();

const gmailRegex = /^[\w.+-]+@gmail\.com$/i;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// SIGNUP - Updated to send verification email
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const rawPassword = String(password || "");

    // SECURITY: Always create as regular user - admins are created manually in MongoDB
    // No role or adminCode should be accepted from signup

    // Validation
    if (!trimmedName || !trimmedEmail || !rawPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!gmailRegex.test(trimmedEmail)) {
      return res
        .status(400)
        .json({ message: "Email must be a valid Gmail address" });
    }

    if (!passwordRegex.test(rawPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    // Check if user exists (including deleted users - prevent re-registration)
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      if (existingUser.isDeleted) {
        return res.status(400).json({
          message:
            "This email was previously registered and cannot be used again",
        });
      }
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: "Email already registered" });
      }
      // If user exists but not verified, allow them to get a new OTP
    }

    // Generate and save OTP
    const otpDoc = await OTP.createOTP(trimmedEmail, "email_verification", 10);

    // Send verification email - MUST succeed
    try {
      await sendVerificationEmail(trimmedEmail, otpDoc.otp, 10);
      console.log(`✅ Verification OTP sent to ${trimmedEmail}: ${otpDoc.otp}`);

      // Store user data temporarily if new user (will be created after verification)
      if (!existingUser) {
        // Hash password for temporary storage
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // Create unverified user
        await User.create({
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          role: "user",
          isAdmin: false,
          isEmailVerified: false,
        });
      }

      res.status(200).json({
        message:
          "Verification email sent. Please check your email to verify your account.",
        email: trimmedEmail,
        requiresVerification: true,
      });
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);

      // Delete the OTP since we couldn't send it
      await otpDoc.deleteOne();

      // Return specific error
      if (
        emailError.message.includes("authentication failed") ||
        emailError.message.includes("Invalid email credentials")
      ) {
        return res.status(500).json({
          message:
            "Email service authentication failed. Please contact support.",
        });
      } else if (emailError.message.includes("connect to email server")) {
        return res.status(500).json({
          message: "Unable to connect to email server. Please try again later.",
        });
      } else {
        return res.status(500).json({
          message: "Failed to send verification email. Please try again.",
        });
      }
    }
  } catch (error) {
    console.error("[Signup] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// VERIFY EMAIL with OTP
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const otpVerification = await OTP.verifyOTP(
      normalizedEmail,
      otp,
      "email_verification",
    );

    if (!otpVerification.success) {
      return res.status(400).json({
        message: otpVerification.message,
        attemptsRemaining: otpVerification.attemptsRemaining,
      });
    }

    // Find user and mark as verified
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log(`✅ Email verified for: ${normalizedEmail}`);

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isAdmin: user.isAdmin || false,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("[Verify Email] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// RESEND OTP - uses top-level sendVerificationEmail (legacy fix)
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otpDoc = await OTP.createOTP(
      normalizedEmail,
      "email_verification",
      10,
    );

    // Send verification email (using top-level import)
    try {
      await sendVerificationEmail(normalizedEmail, otpDoc.otp, 10);
      console.log(`✅ OTP resent to ${normalizedEmail}: ${otpDoc.otp}`);

      res.json({
        message: "Verification code sent to your email",
        email: normalizedEmail,
      });
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
      await otpDoc.deleteOne();

      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }
  } catch (error) {
    console.error("[Resend OTP] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const trimmedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const rawPassword = String(password || "");

    // Validation
    if (!trimmedEmail || !rawPassword) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user (exclude deleted users); include password for verification (schema has select: false)
    const user = await User.findOne({
      email: trimmedEmail,
      isDeleted: { $ne: true },
    }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isEmailVerified && !user.googleId) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your email for the verification code.",
        requiresVerification: true,
        email: trimmedEmail,
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.accountLockedUntil - new Date()) / 60000,
      );
      return res.status(403).json({
        message: `Account locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s)`,
      });
    }

    // Reset lock if time has passed
    if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      await user.save();
    }

    // Check if user registered with Google (no password set)
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account was created with Google. Please sign in using Continue with Google.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    if (!isMatch) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;

      // Lock account after 3 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 3) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        return res.status(403).json({
          message:
            "Account locked due to 3 failed login attempts. Try again in 15 minutes or reset your password.",
        });
      }

      await user.save();
      const attemptsLeft = 3 - user.failedLoginAttempts;
      return res.status(401).json({
        message: `Invalid email or password. ${attemptsLeft} attempt(s) remaining`,
        attemptsRemaining: attemptsLeft,
      });
    }

    // Successful login - reset failed attempts
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PROFILE
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.userId,
      isDeleted: { $ne: true },
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
        dietaryPreferences: user.dietaryPreferences || [],
        allergens: user.allergens || [],
        height: user.height,
        weight: user.weight,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        healthGoal: user.healthGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE PROFILE
router.put("/me", auth, async (req, res) => {
  try {
    const {
      name,
      email,
      dietaryPreferences,
      allergens,
      height,
      weight,
      bmi,
      bmiCategory,
      healthGoal,
    } = req.body;

    const user = await User.findOne({
      _id: req.userId,
      isDeleted: { $ne: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update name if provided
    if (name !== undefined) {
      const trimmedName = String(name || "").trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      user.name = trimmedName;
    }

    // Update email if provided
    if (email !== undefined) {
      const trimmedEmail = String(email || "")
        .trim()
        .toLowerCase();
      if (!trimmedEmail) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }

      if (!gmailRegex.test(trimmedEmail)) {
        return res
          .status(400)
          .json({ message: "Email must be a valid Gmail address" });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: req.userId },
        isDeleted: { $ne: true },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      user.email = trimmedEmail;
    }

    // Update dietary preferences if provided
    if (dietaryPreferences !== undefined) {
      user.dietaryPreferences = Array.isArray(dietaryPreferences)
        ? dietaryPreferences
        : [];
    }

    // Update allergens if provided
    if (allergens !== undefined) {
      user.allergens = Array.isArray(allergens) ? allergens : [];
    }

    // Update height if provided
    if (height !== undefined) {
      user.height = height ? Number(height) : null;
    }

    // Update weight if provided
    if (weight !== undefined) {
      user.weight = weight ? Number(weight) : null;
    }

    // Update BMI if provided
    if (bmi !== undefined) {
      user.bmi = bmi ? Number(bmi) : null;
    }

    // Update BMI category if provided
    if (bmiCategory !== undefined) {
      user.bmiCategory = bmiCategory || null;
    }

    // Update health goal if provided
    if (healthGoal !== undefined) {
      if (
        healthGoal &&
        !["weight_loss", "weight_gain", "maintenance"].includes(healthGoal)
      ) {
        return res.status(400).json({
          message:
            "Invalid health goal. Must be weight_loss, weight_gain, or maintenance",
        });
      }
      user.healthGoal = healthGoal || null;
    }

    await user.save();

    // Clear recommendation cache so next load uses new preferences (diet, allergens, BMI, health goal)
    await RecommendationCache.deleteOne({ userId: req.userId }).catch(() => {});

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
        dietaryPreferences: user.dietaryPreferences || [],
        allergens: user.allergens || [],
        height: user.height,
        weight: user.weight,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        healthGoal: user.healthGoal || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
