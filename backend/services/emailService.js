const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // For development, you can use ethereal email (fake SMTP)
  // For production, use real SMTP (Gmail, SendGrid, etc.)

  // Check if SMTP credentials are configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("📧 Initializing email transporter with Gmail...");
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Use App Password for Gmail
      },
    });
  }

  // Fallback: Log to console in development
  console.warn(
    "⚠️  No SMTP credentials found. Emails will be logged to console.",
  );
  console.warn(
    "⚠️  Set SMTP_USER and SMTP_PASS in .env to enable email sending",
  );
  return null;
};

// Email templates
const emailTemplates = {
  verifyEmail: (otp, expiryMinutes = 10) => ({
    subject: "Verify Your Email - MealVista",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ MealVista</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up with MealVista! Please use the following OTP to verify your email address:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This OTP will expire in ${expiryMinutes} minutes.</strong></p>
            
            <div class="warning">
              <p><strong>⚠️ Security Tips:</strong></p>
              <ul style="text-align: left;">
                <li>Never share this OTP with anyone</li>
                <li>MealVista will never ask for your OTP via phone or email</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 MealVista. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      MealVista - Email Verification
      
      Your OTP code is: ${otp}
      
      This OTP will expire in ${expiryMinutes} minutes.
      
      If you didn't request this, please ignore this email.
    `,
  }),

  resetPassword: (otp, expiryMinutes = 10) => ({
    subject: "Reset Your Password - MealVista",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #f5576c; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 5px; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 MealVista</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Please use the following OTP to continue:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your password reset code is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This OTP will expire in ${expiryMinutes} minutes.</strong></p>
            
            <div class="warning">
              <p><strong>⚠️ Security Alert:</strong></p>
              <ul style="text-align: left;">
                <li>If you didn't request a password reset, ignore this email</li>
                <li>Never share this OTP with anyone</li>
                <li>Change your password immediately if you suspect unauthorized access</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 MealVista. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      MealVista - Password Reset
      
      Your password reset OTP code is: ${otp}
      
      This OTP will expire in ${expiryMinutes} minutes.
      
      If you didn't request this, please ignore this email.
    `,
  }),
};

// Send email function
const sendEmail = async (to, template, data) => {
  const transporter = createTransporter();

  // If no transporter (development without SMTP), log to console
  if (!transporter) {
    console.log("\n📧 ========== EMAIL (CONSOLE LOG) ==========");
    console.log("To:", to);
    console.log("Subject:", template.subject);
    console.log("Data:", data);
    console.log("OTP:", data.otp);
    console.log("==========================================\n");
    return {
      success: true,
      message: "Email logged to console (development mode)",
    };
  }

  try {
    const mailOptions = {
      from: `"MealVista" <${process.env.SMTP_USER || "noreply@mealvista.com"}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    console.log(`📧 Attempting to send email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);

    // Check for specific error types
    if (error.code === "EAUTH") {
      console.error(
        "❌ Authentication failed - Check SMTP_USER and SMTP_PASS in .env",
      );
      throw new Error(
        "Email authentication failed. Please check email configuration.",
      );
    } else if (error.code === "ESOCKET") {
      console.error("❌ Connection failed - Check SMTP_HOST and SMTP_PORT");
      throw new Error("Unable to connect to email server.");
    } else if (error.responseCode === 535) {
      console.error("❌ Invalid credentials - Wrong email or app password");
      throw new Error(
        "Invalid email credentials. Please verify your email settings.",
      );
    }

    throw new Error("Failed to send email: " + error.message);
  }
};

// Public API
module.exports = {
  sendVerificationEmail: async (email, otp, expiryMinutes = 10) => {
    const template = emailTemplates.verifyEmail(otp, expiryMinutes);
    return sendEmail(email, template, { otp, expiryMinutes });
  },

  sendPasswordResetEmail: async (email, otp, expiryMinutes = 10) => {
    const template = emailTemplates.resetPassword(otp, expiryMinutes);
    return sendEmail(email, template, { otp, expiryMinutes });
  },
};
