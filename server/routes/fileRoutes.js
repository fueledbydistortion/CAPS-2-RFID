const express = require("express");
const router = express.Router();
const { upload } = require("../config/multerConfig");
const { authenticateToken } = require("../middleware/auth");
const {
  uploadFile,
  uploadLessonFiles,
  deleteLessonFile,
  getFileInfo,
  downloadFile,
  uploadProfilePicture,
  deleteProfilePicture,
} = require("../controllers/fileController");

// File upload routes
router.post("/upload", upload.single("file"), uploadFile); // Generic file upload
router.post(
  "/lesson/:lessonId/upload",
  upload.array("files", 5),
  uploadLessonFiles
); // Upload files to lesson
router.delete("/lesson/:lessonId/:filename", deleteLessonFile); // Delete file from lesson
router.get("/lesson/:lessonId/:filename/info", getFileInfo); // Get file info
router.get("/lesson/:lessonId/:filename/download", downloadFile); // Download file
router.post(
  "/profile-picture/:uid",
  authenticateToken,
  upload.single("profilePicture"),
  uploadProfilePicture
); // Upload profile picture
router.delete("/profile-picture/:uid", authenticateToken, deleteProfilePicture); // Delete profile picture

module.exports = router;
