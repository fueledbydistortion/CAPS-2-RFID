const { upload, deleteFile, getFileUrl } = require("../config/multerConfig");
const { db, admin } = require("../config/firebase-admin-config");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
  uploadMultipleFiles,
  getFileMetadata,
} = require("../config/firebaseStorage");
const path = require("path");
const fs = require("fs");

// Upload files for a lesson using Firebase Storage
const uploadLessonFiles = async (req, res) => {
  try {
    console.log("Upload request received for lesson:", req.params.lessonId);
    console.log("Files received:", req.files ? req.files.length : 0);

    const { lessonId } = req.params;

    if (!lessonId) {
      console.error("No lesson ID provided");
      return res.status(400).json({
        success: false,
        error: "Lesson ID is required",
      });
    }

    if (!req.files || req.files.length === 0) {
      console.error("No files in request");
      return res.status(400).json({
        success: false,
        error: "No files uploaded",
      });
    }

    console.log("Checking if lesson exists:", lessonId);
    // Check if lesson exists
    const lessonSnapshot = await db.ref(`lessons/${lessonId}`).once("value");
    if (!lessonSnapshot.exists()) {
      console.error("Lesson not found:", lessonId);
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const lesson = lessonSnapshot.val();
    const currentAttachments = lesson.attachments || [];
    console.log("Current attachments:", currentAttachments.length);

    // Upload files to Firebase Storage
    console.log("Uploading files to Firebase Storage...");
    const uploadResult = await uploadMultipleFiles(
      req.files,
      `lessons/${lessonId}`
    );
    console.log("Upload result:", uploadResult);

    if (!uploadResult.success) {
      console.error("Upload failed:", uploadResult.errors);
      return res.status(500).json({
        success: false,
        error: "Failed to upload some files",
        details: uploadResult.errors,
      });
    }

    // Process uploaded files with Firebase Storage URLs
    const uploadedFiles = uploadResult.data.map((file) => ({
      name: file.originalName,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      url: file.url,
      folder: file.folder,
      uploadedAt: admin.database.ServerValue.TIMESTAMP,
    }));
    console.log("Processed files:", uploadedFiles.length);

    // Add new attachments to existing ones
    const updatedAttachments = [...currentAttachments, ...uploadedFiles];

    // Update lesson with new attachments
    console.log("Updating lesson in database...");
    await db.ref(`lessons/${lessonId}`).update({
      attachments: updatedAttachments,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
    console.log("Lesson updated successfully");

    res.json({
      success: true,
      data: {
        lessonId,
        attachments: updatedAttachments,
        newFiles: uploadedFiles,
        uploadedCount: uploadResult.uploadedCount,
        failedCount: uploadResult.failedCount,
      },
      message: `${uploadedFiles.length} file(s) uploaded successfully to Firebase Storage`,
    });
  } catch (error) {
    console.error("Error uploading lesson files:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to upload files: " + error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Delete a file from a lesson and Firebase Storage
const deleteLessonFile = async (req, res) => {
  try {
    const { lessonId, filename } = req.params;

    if (!lessonId || !filename) {
      return res.status(400).json({
        success: false,
        error: "Lesson ID and filename are required",
      });
    }

    // Check if lesson exists
    const lessonSnapshot = await db.ref(`lessons/${lessonId}`).once("value");
    if (!lessonSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const lesson = lessonSnapshot.val();
    const attachments = lesson.attachments || [];

    // Find the attachment to remove
    const attachmentIndex = attachments.findIndex(
      (att) => att.filename === filename
    );
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "File not found in lesson",
      });
    }

    const attachment = attachments[attachmentIndex];

    // Delete file from Firebase Storage
    if (attachment.path) {
      const deleteResult = await deleteFromFirebaseStorage(attachment.path);
      if (!deleteResult.success) {
        console.warn(
          "Warning: Could not delete file from Firebase Storage:",
          deleteResult.error
        );
        // Continue anyway to remove from database
      }
    } else {
      // Try deleting from local filesystem (legacy files)
      deleteFile(attachment.path);
    }

    // Remove attachment from lesson
    const updatedAttachments = attachments.filter(
      (att) => att.filename !== filename
    );

    await db.ref(`lessons/${lessonId}`).update({
      attachments: updatedAttachments,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });

    res.json({
      success: true,
      data: {
        lessonId,
        attachments: updatedAttachments,
        deletedFile: attachment,
      },
      message: "File deleted successfully from Firebase Storage",
    });
  } catch (error) {
    console.error("Error deleting lesson file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file: " + error.message,
    });
  }
};

// Get file info
const getFileInfo = async (req, res) => {
  try {
    const { lessonId, filename } = req.params;

    if (!lessonId || !filename) {
      return res.status(400).json({
        success: false,
        error: "Lesson ID and filename are required",
      });
    }

    // Check if lesson exists
    const lessonSnapshot = await db.ref(`lessons/${lessonId}`).once("value");
    if (!lessonSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const lesson = lessonSnapshot.val();
    const attachments = lesson.attachments || [];

    // Find the attachment
    const attachment = attachments.find((att) => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    res.json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    console.error("Error getting file info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get file info: " + error.message,
    });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const { lessonId, filename } = req.params;

    if (!lessonId || !filename) {
      return res.status(400).json({
        success: false,
        error: "Lesson ID and filename are required",
      });
    }

    // Check if lesson exists
    const lessonSnapshot = await db.ref(`lessons/${lessonId}`).once("value");
    if (!lessonSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const lesson = lessonSnapshot.val();
    const attachments = lesson.attachments || [];

    // Find the attachment
    const attachment = attachments.find((att) => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Set appropriate headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.name}"`
    );
    res.setHeader("Content-Type", attachment.mimetype);

    // Send file
    res.download(attachment.path, attachment.name);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download file: " + error.message,
    });
  }
};

// Generic file upload using Firebase Storage
const uploadFile = async (req, res) => {
  try {
    const { category } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const file = req.file;
    const folder = category || "general";

    // Upload to Firebase Storage
    const uploadResult = await uploadToFirebaseStorage(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to upload file to Firebase Storage",
        details: uploadResult.error,
      });
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create file data
    const fileData = {
      id: fileId,
      name: uploadResult.data.originalName,
      filename: uploadResult.data.filename,
      path: uploadResult.data.path,
      size: uploadResult.data.size,
      mimetype: uploadResult.data.mimetype,
      url: uploadResult.data.url,
      category: folder,
      uploadedAt: admin.database.ServerValue.TIMESTAMP,
    };

    res.json({
      success: true,
      data: fileData,
      message: "File uploaded successfully to Firebase Storage",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload file: " + error.message,
    });
  }
};

// Upload profile picture for a user
const uploadProfilePicture = async (req, res) => {
  try {
    console.log(
      "Profile picture upload request received for user:",
      req.params.uid
    );

    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Validate file type (only images)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid file type. Only images (JPEG, PNG, GIF, WEBP) are allowed.",
      });
    }

    console.log("Checking if user exists:", uid);
    // Check if user exists
    const userSnapshot = await db.ref(`users/${uid}`).once("value");
    if (!userSnapshot.exists()) {
      console.error("User not found:", uid);
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = userSnapshot.val();
    console.log("User found:", uid);

    // If user has an old profile picture, delete it from Firebase Storage
    if (
      user.photoURL &&
      user.photoURL.includes("firebasestorage.googleapis.com")
    ) {
      try {
        // Extract file path from Firebase Storage URL
        const urlParts = user.photoURL.split("/o/")[1];
        if (urlParts) {
          const filePath = decodeURIComponent(urlParts.split("?")[0]);
          console.log("Deleting old profile picture:", filePath);
          await deleteFromFirebaseStorage(filePath);
        }
      } catch (deleteError) {
        console.warn(
          "Could not delete old profile picture:",
          deleteError.message
        );
        // Continue with upload even if deletion fails
      }
    }

    // Upload new profile picture to Firebase Storage
    console.log("Uploading new profile picture to Firebase Storage");
    const uploadResult = await uploadToFirebaseStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `profile-pictures/${uid}`
    );

    if (!uploadResult.success) {
      console.error(
        "Failed to upload to Firebase Storage:",
        uploadResult.error
      );
      return res.status(500).json({
        success: false,
        error: "Failed to upload profile picture: " + uploadResult.error,
      });
    }

    console.log(
      "Profile picture uploaded successfully:",
      uploadResult.data.url
    );

    // Update user profile with new photo URL
    await db.ref(`users/${uid}`).update({
      photoURL: uploadResult.data.url,
      profilePictureUpdatedAt: new Date().toISOString(),
    });

    console.log("User profile updated with new photo URL");

    res.status(200).json({
      success: true,
      data: {
        photoURL: uploadResult.data.url,
        message: "Profile picture uploaded successfully",
      },
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload profile picture",
    });
  }
};

// Delete profile picture for a user
const deleteProfilePicture = async (req, res) => {
  try {
    console.log(
      "Profile picture delete request received for user:",
      req.params.uid
    );

    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    console.log("Checking if user exists:", uid);
    // Check if user exists
    const userSnapshot = await db.ref(`users/${uid}`).once("value");
    if (!userSnapshot.exists()) {
      console.error("User not found:", uid);
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = userSnapshot.val();
    console.log("User found:", uid);

    // If user has a profile picture, delete it from Firebase Storage
    if (
      user.photoURL &&
      user.photoURL.includes("firebasestorage.googleapis.com")
    ) {
      try {
        // Extract file path from Firebase Storage URL
        const urlParts = user.photoURL.split("/o/")[1];
        if (urlParts) {
          const filePath = decodeURIComponent(urlParts.split("?")[0]);
          console.log("Deleting profile picture:", filePath);
          await deleteFromFirebaseStorage(filePath);
        }
      } catch (deleteError) {
        console.warn(
          "Could not delete profile picture from storage:",
          deleteError.message
        );
        // Continue with database update even if storage deletion fails
      }
    }

    // Update user profile to remove photo URL
    await db.ref(`users/${uid}`).update({
      photoURL: null,
      profilePictureUpdatedAt: new Date().toISOString(),
    });

    console.log("User profile updated - photo URL removed");

    res.status(200).json({
      success: true,
      data: {
        photoURL: null,
        message: "Profile picture deleted successfully",
      },
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete profile picture",
    });
  }
};

module.exports = {
  uploadFile,
  uploadLessonFiles,
  deleteLessonFile,
  getFileInfo,
  downloadFile,
  uploadProfilePicture,
  deleteProfilePicture,
};
