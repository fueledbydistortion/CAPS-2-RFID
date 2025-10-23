const admin = require("firebase-admin");

// Create kiosk session
const createKioskSession = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const userId = req.user.uid;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        error: "Schedule ID is required",
      });
    }

    // Check if user is teacher or admin
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = userDoc.data();
    if (userData.role !== "teacher" && userData.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only teachers and admins can create kiosk sessions",
      });
    }

    // Check if schedule exists
    const scheduleDoc = await admin
      .firestore()
      .collection("schedules")
      .doc(scheduleId)
      .get();
    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    const scheduleData = scheduleDoc.data();

    // End any existing kiosk session for this user
    const existingSessions = await admin
      .firestore()
      .collection("kioskSessions")
      .where("createdBy", "==", userId)
      .where("isActive", "==", true)
      .get();

    const batch = admin.firestore().batch();
    existingSessions.forEach((doc) => {
      batch.update(doc.ref, {
        isActive: false,
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Create new kiosk session
    const { v4: uuidv4 } = await import("uuid");
    const sessionId = uuidv4();
    const sessionData = {
      sessionId,
      scheduleId,
      scheduleName: `${scheduleData.day} - ${scheduleData.sectionName}`,
      createdBy: userId,
      createdByName: `${userData.firstName} ${userData.lastName}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isActive: true,
      endedAt: null,
    };

    const sessionRef = admin
      .firestore()
      .collection("kioskSessions")
      .doc(sessionId);
    batch.set(sessionRef, sessionData);
    await batch.commit();

    res.json({
      success: true,
      data: {
        sessionId,
        scheduleId,
        scheduleName: sessionData.scheduleName,
        expiresAt: sessionData.expiresAt,
        kioskUrl: `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/kiosk/${sessionId}`,
      },
    });
  } catch (error) {
    console.error("Error creating kiosk session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create kiosk session",
    });
  }
};

// Get current kiosk session for user
const getCurrentKioskSession = async (req, res) => {
  try {
    const userId = req.user.uid;

    const sessionQuery = await admin
      .firestore()
      .collection("kioskSessions")
      .where("createdBy", "==", userId)
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (sessionQuery.empty) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const sessionDoc = sessionQuery.docs[0];
    const sessionData = sessionDoc.data();

    // Check if session has expired
    if (new Date() > sessionData.expiresAt.toDate()) {
      // Mark session as inactive
      await sessionDoc.ref.update({
        isActive: false,
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        scheduleId: sessionData.scheduleId,
        scheduleName: sessionData.scheduleName,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
      },
    });
  } catch (error) {
    console.error("Error getting current kiosk session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get kiosk session",
    });
  }
};

// End kiosk session
const endKioskSession = async (req, res) => {
  try {
    const userId = req.user.uid;

    const sessionQuery = await admin
      .firestore()
      .collection("kioskSessions")
      .where("createdBy", "==", userId)
      .where("isActive", "==", true)
      .get();

    if (sessionQuery.empty) {
      return res.json({
        success: true,
        message: "No active kiosk session found",
      });
    }

    const batch = admin.firestore().batch();
    sessionQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isActive: false,
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    res.json({
      success: true,
      message: "Kiosk session ended successfully",
    });
  } catch (error) {
    console.error("Error ending kiosk session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end kiosk session",
    });
  }
};

// Validate kiosk session (for public access)
const validateKioskSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionDoc = await admin
      .firestore()
      .collection("kioskSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Kiosk session not found",
      });
    }

    const sessionData = sessionDoc.data();

    // Check if session is active and not expired
    if (!sessionData.isActive || new Date() > sessionData.expiresAt.toDate()) {
      return res.status(400).json({
        success: false,
        error: "Kiosk session is not active or has expired",
      });
    }

    // Get schedule details
    const scheduleDoc = await admin
      .firestore()
      .collection("schedules")
      .doc(sessionData.scheduleId)
      .get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    const scheduleData = scheduleDoc.data();

    res.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        scheduleId: sessionData.scheduleId,
        scheduleName: sessionData.scheduleName,
        scheduleData: scheduleData,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
      },
    });
  } catch (error) {
    console.error("Error validating kiosk session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate kiosk session",
    });
  }
};

// Get kiosk session by token (for public access)
const getKioskSessionByToken = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionDoc = await admin
      .firestore()
      .collection("kioskSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Kiosk session not found",
      });
    }

    const sessionData = sessionDoc.data();

    // Check if session is active and not expired
    if (!sessionData.isActive || new Date() > sessionData.expiresAt.toDate()) {
      return res.status(400).json({
        success: false,
        error: "Kiosk session is not active or has expired",
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        scheduleId: sessionData.scheduleId,
        scheduleName: sessionData.scheduleName,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
      },
    });
  } catch (error) {
    console.error("Error getting kiosk session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get kiosk session",
    });
  }
};

module.exports = {
  createKioskSession,
  getCurrentKioskSession,
  endKioskSession,
  validateKioskSession,
  getKioskSessionByToken,
};

