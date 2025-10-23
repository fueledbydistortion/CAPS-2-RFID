const admin = require("firebase-admin");

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  console.log("🔍 Auth middleware called for:", req.path);
  console.log("🔍 Auth header present:", !!req.headers.authorization);

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid auth header");
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    console.log("🔍 Token length:", idToken ? idToken.length : 0);

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("🔍 Token verified for user:", decodedToken.uid);

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User authentication required",
        });
      }

      // Get user profile from database to check role
      const { db } = require("../config/firebase-admin-config");
      const userSnapshot = await db.ref(`users/${req.user.uid}`).once("value");

      if (!userSnapshot.exists()) {
        return res.status(404).json({
          success: false,
          error: "User profile not found",
        });
      }

      const userProfile = userSnapshot.val();
      req.userProfile = userProfile;

      // Check if user role is allowed
      if (!allowedRoles.includes(userProfile.role)) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        success: false,
        error: "Authorization check failed",
      });
    }
  };
};

// Middleware for parent-specific operations
const authorizeParent = authorizeRole(["parent"]);

// Middleware for teacher-specific operations
const authorizeTeacher = authorizeRole(["teacher", "admin"]);

// Middleware for admin-specific operations (now includes teachers)
const authorizeAdmin = authorizeRole(["admin", "teacher"]);

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeParent,
  authorizeTeacher,
  authorizeAdmin,
};
