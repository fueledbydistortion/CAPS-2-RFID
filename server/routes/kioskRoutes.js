const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  createKioskSession,
  getCurrentKioskSession,
  endKioskSession,
  validateKioskSession,
  getKioskSessionByToken,
} = require("../controllers/kioskController");

// Protected routes (require authentication)
router.post("/create", authenticateToken, createKioskSession);
router.get("/current", authenticateToken, getCurrentKioskSession);
router.post("/end", authenticateToken, endKioskSession);

// Public routes (for kiosk access)
router.get("/validate/:sessionId", validateKioskSession);
router.get("/session/:sessionId", getKioskSessionByToken);

module.exports = router;

