const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getAllUsers,
  getUserById,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  bulkImportParents,
  getUsersForRFID,
} = require("../controllers/userController");

// Get all users
router.get("/", authenticateToken, getAllUsers);

// Public endpoint for RFID scanning (no authentication required)
router.get("/rfid", getUsersForRFID);

// Get user by ID
router.get("/:uid", authenticateToken, getUserById);

// Get users by role
router.get("/role/:role", authenticateToken, getUsersByRole);

// Search users
router.get("/search", authenticateToken, searchUsers);

// Bulk import parents
router.post("/bulk-import", authenticateToken, bulkImportParents);

// Create user
router.post("/", authenticateToken, createUser);

// Update user
router.put("/:uid", authenticateToken, updateUser);

// Delete user - requires authentication
router.delete("/:uid", authenticateToken, deleteUser);

module.exports = router;
