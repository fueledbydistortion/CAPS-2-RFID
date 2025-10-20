const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Generate a temporary password reset code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Store reset codes temporarily (in production, use Redis or database)
const resetCodes = new Map();

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'academiccompilation@gmail.com',
      pass: 'dmci faoj engx nldm'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send password reset email
const sendResetEmail = async (email, resetCode) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: 'academiccomppilation@gmail.com',
      to: email,
      subject: 'SmartChildcare Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(45deg, #1f7850, #2d8f5a); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">SmartChildcare</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f7850; margin-top: 0;">Password Reset Code</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              You have requested to reset your password for your SmartChildcare account.
            </p>
            
            <div style="background: white; border: 2px solid #1f7850; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
              <h1 style="margin: 10px 0; font-size: 36px; color: #1f7850; letter-spacing: 5px; font-family: monospace;">${resetCode}</h1>
            </div>
            
            <p style="font-size: 14px; color: #666; background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn't request this password reset, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This email was sent from SmartChildcare System<br>
              Kapitbahayan Child Development Center<br>
              Navotas City, Metro Manila
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
router.post('/send-reset-email', async (req, res) => {
  try {
    console.log('Password reset request received:', req.body);
    const { email } = req.body;

    if (!email) {
      console.log('No email provided');
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    console.log('Looking for user with email:', email);

    // Find user by email in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      console.log('Firebase Auth error:', error.message);
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store reset code
    resetCodes.set(email, {
      code: resetCode,
      expiresAt: expiresAt,
      userId: userRecord.uid
    });

    // Try to send email with reset code
    const emailResult = await sendResetEmail(email, resetCode);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Password reset code sent to your email address',
        expiresIn: 10 // minutes
      });
    } else {
      // If email fails, return the code directly for testing
      console.log('Email sending failed, returning code directly for testing');
      res.json({
        success: true,
        message: 'Password reset code generated (email service unavailable)',
        resetCode: resetCode, // For testing purposes only
        expiresIn: 10 // minutes
      });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify reset code and update password
router.post('/verify-reset-code', async (req, res) => {
  try {
    console.log('Verify reset code request received:', req.body);
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      console.log('Missing required fields:', { email: !!email, code: !!code, newPassword: !!newPassword });
      return res.status(400).json({
        success: false,
        error: 'Email, code, and new password are required'
      });
    }

    // Check if reset code exists and is valid
    const resetData = resetCodes.get(email);
    
    if (!resetData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code'
      });
    }

    // Check if code has expired
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Reset code has expired'
      });
    }

    // Verify the code
    if (resetData.code !== code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset code'
      });
    }

    // Update password in Firebase Auth
    try {
      await admin.auth().updateUser(resetData.userId, {
        password: newPassword
      });

      // Clean up reset code
      resetCodes.delete(email);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
