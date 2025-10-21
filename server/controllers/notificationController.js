const { db } = require("../config/firebase-admin-config");
const {
  shouldReceiveNotification,
} = require("./notificationPreferencesController");
const { safeDbQuery } = require("../utils/timeoutWrapper");

/**
 * Internal helper to create a notification (can be called from other controllers)
 */
const createNotificationInternal = async (notificationData) => {
  try {
    const {
      recipientId,
      recipientRole,
      type,
      title,
      message,
      priority,
      actionUrl,
      metadata,
      createdBy,
    } = notificationData;

    // Validate required fields
    if (!recipientId || !recipientRole || !type || !title || !message) {
      console.error("Missing required notification fields:", notificationData);
      return {
        success: false,
        error:
          "Missing required fields: recipientId, recipientRole, type, title, message",
      };
    }

    // Check if user should receive this type of notification
    const shouldReceive = await shouldReceiveNotification(
      recipientId,
      type,
      "inApp"
    );
    if (!shouldReceive) {
      console.log(
        "🔕 Notification blocked by user preferences:",
        title,
        "for user:",
        recipientId
      );
      return {
        success: false,
        blocked: true,
        message: "Notification blocked by user preferences",
      };
    }

    const finalNotificationData = {
      recipientId,
      recipientRole,
      type, // 'announcement', 'attendance', 'assignment', 'badge', 'system', 'message'
      title,
      message,
      priority: priority || "normal", // 'low', 'normal', 'high', 'urgent'
      actionUrl: actionUrl || null,
      metadata: metadata || null,
      read: false,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || "system",
    };

    const notificationRef = await db
      .ref("notifications")
      .push(finalNotificationData);

    console.log("✅ Notification created:", title, "for user:", recipientId);

    return {
      success: true,
      data: {
        id: notificationRef.key,
        ...finalNotificationData,
      },
    };
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    return {
      success: false,
      error: "Failed to create notification: " + error.message,
    };
  }
};

/**
 * Create a new notification (API endpoint)
 */
const createNotification = async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      createdBy: req.user?.uid || "system",
    };

    const result = await createNotificationInternal(notificationData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in createNotification endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create notification: " + error.message,
    });
  }
};

/**
 * Get all notifications for a user with pagination
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { unreadOnly, limit = 20, type, page = 1 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Cap at 50 items per page
    const offset = (pageNum - 1) * limitNum;

    // Get notifications from Firebase with optimized query and timeout
    const result = await safeDbQuery(() =>
      db
        .ref("notifications")
        .orderByChild("recipientId")
        .equalTo(userId)
        .once("value")
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const notificationsSnapshot = result.data;

    let notifications = [];
    if (notificationsSnapshot.exists()) {
      notificationsSnapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // Filter by read status if specified
    if (unreadOnly === "true") {
      notifications = notifications.filter((notif) => !notif.read);
    }

    // Filter by type if specified
    if (type) {
      notifications = notifications.filter((notif) => notif.type === type);
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const totalCount = notifications.length;
    const paginatedNotifications = notifications.slice(
      offset,
      offset + limitNum
    );

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: offset + limitNum < totalCount,
        hasPrev: pageNum > 1,
      },
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications: " + error.message,
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const result = await safeDbQuery(() =>
      db
        .ref("notifications")
        .orderByChild("recipientId")
        .equalTo(userId)
        .once("value")
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const notificationsSnapshot = result.data;

    let unreadCount = 0;
    if (notificationsSnapshot.exists()) {
      notificationsSnapshot.forEach((childSnapshot) => {
        const notif = childSnapshot.val();
        if (!notif.read) {
          unreadCount++;
        }
      });
    }

    res.json({
      success: true,
      count: unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count: " + error.message,
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: "Notification ID is required",
      });
    }

    const notificationRef = db.ref(`notifications/${notificationId}`);
    const notificationSnapshot = await notificationRef.once("value");

    if (!notificationSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    await notificationRef.update({
      read: true,
      readAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read: " + error.message,
    });
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const notificationsSnapshot = await db
      .ref("notifications")
      .orderByChild("recipientId")
      .equalTo(userId)
      .once("value");

    if (!notificationsSnapshot.exists()) {
      return res.json({
        success: true,
        message: "No notifications found",
      });
    }

    const updates = {};
    notificationsSnapshot.forEach((childSnapshot) => {
      const notif = childSnapshot.val();
      if (!notif.read) {
        updates[`notifications/${childSnapshot.key}/read`] = true;
        updates[`notifications/${childSnapshot.key}/readAt`] =
          new Date().toISOString();
      }
    });

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: Object.keys(updates).length / 2,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read: " + error.message,
    });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: "Notification ID is required",
      });
    }

    const notificationRef = db.ref(`notifications/${notificationId}`);
    const notificationSnapshot = await notificationRef.once("value");

    if (!notificationSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    await notificationRef.remove();

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification: " + error.message,
    });
  }
};

/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const notificationsSnapshot = await db
      .ref("notifications")
      .orderByChild("recipientId")
      .equalTo(userId)
      .once("value");

    if (!notificationsSnapshot.exists()) {
      return res.json({
        success: true,
        message: "No notifications found",
      });
    }

    const updates = {};
    notificationsSnapshot.forEach((childSnapshot) => {
      updates[`notifications/${childSnapshot.key}`] = null;
    });

    await db.ref().update(updates);

    res.json({
      success: true,
      message: "All notifications deleted successfully",
      deletedCount: Object.keys(updates).length,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete all notifications: " + error.message,
    });
  }
};

/**
 * Broadcast notification to multiple users
 */
const broadcastNotification = async (req, res) => {
  try {
    const {
      recipientIds,
      recipientRole,
      type,
      title,
      message,
      priority,
      actionUrl,
      metadata,
    } = req.body;

    // Validate required fields
    if (
      !recipientIds ||
      !Array.isArray(recipientIds) ||
      recipientIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "recipientIds array is required and cannot be empty",
      });
    }

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: type, title, message",
      });
    }

    const notifications = [];
    const updates = {};
    const blockedUsers = [];

    for (const recipientId of recipientIds) {
      // Check if user should receive this type of notification
      const shouldReceive = await shouldReceiveNotification(
        recipientId,
        type,
        "inApp"
      );
      if (!shouldReceive) {
        console.log(
          "🔕 Broadcast notification blocked by user preferences for user:",
          recipientId
        );
        blockedUsers.push(recipientId);
        continue;
      }

      const notificationData = {
        recipientId,
        recipientRole: recipientRole || "all",
        type,
        title,
        message,
        priority: priority || "normal",
        actionUrl: actionUrl || null,
        metadata: metadata || null,
        read: false,
        createdAt: new Date().toISOString(),
        createdBy: req.user?.uid || "system",
      };

      const notificationRef = db.ref("notifications").push();
      updates[`notifications/${notificationRef.key}`] = notificationData;
      notifications.push({
        id: notificationRef.key,
        ...notificationData,
      });
    }

    await db.ref().update(updates);

    res.status(201).json({
      success: true,
      data: notifications,
      count: notifications.length,
      blockedCount: blockedUsers.length,
      blockedUsers: blockedUsers,
      message:
        notifications.length > 0
          ? `Notifications broadcast successfully${
              blockedUsers.length > 0
                ? ` (${blockedUsers.length} blocked by preferences)`
                : ""
            }`
          : "All notifications were blocked by user preferences",
    });
  } catch (error) {
    console.error("Error broadcasting notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to broadcast notifications: " + error.message,
    });
  }
};

module.exports = {
  createNotification,
  createNotificationInternal,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  broadcastNotification,
};
