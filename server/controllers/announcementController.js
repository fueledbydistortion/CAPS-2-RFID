const { db, admin } = require('../config/firebase-admin-config');
const { createNotificationInternal } = require('./notificationController');

// Create a new announcement
const createAnnouncement = async (req, res) => {
  try {
    const { title, description, date, type, createdBy } = req.body;

    // Validate required fields
    if (!title || !date || !type || !createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Title, date, type, and createdBy are required'
      });
    }

    // Validate type
    const validTypes = ['announcement', 'event', 'holiday', 'meeting', 'reminder'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create announcement data
    const announcementData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      date: date.trim(),
      type: type.trim(),
      createdBy: createdBy.trim(),
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    // Add announcement to database
    const announcementRef = db.ref('announcements').push();
    const announcementId = announcementRef.key;

    // Create announcement data with ID
    const announcementWithId = {
      id: announcementId,
      ...announcementData
    };

    await announcementRef.set(announcementWithId);

    // Notify all parents about the new announcement
    try {
      const usersSnapshot = await db.ref('users').orderByChild('role').equalTo('parent').once('value');
      const parentIds = [];
      
      if (usersSnapshot.exists()) {
        usersSnapshot.forEach((childSnapshot) => {
          parentIds.push(childSnapshot.key);
        });
      }

      if (parentIds.length > 0) {
        const announcementEmoji = type === 'event' ? '📅' : type === 'holiday' ? '🎉' : type === 'meeting' ? '👥' : '📢';
        const priority = type === 'holiday' || type === 'meeting' ? 'high' : 'normal';
        
        // Create notification for each parent
        for (const parentId of parentIds) {
          await createNotificationInternal({
            recipientId: parentId,
            recipientRole: 'parent',
            type: 'announcement',
            title: `${announcementEmoji} ${title}`,
            message: description ? description.substring(0, 100) : `New ${type} posted`,
            priority: priority,
            actionUrl: '/dashboard/calendar',
            metadata: {
              announcementId,
              type,
              date
            },
            createdBy: req.user?.uid || createdBy
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating announcement notifications:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: announcementWithId,
      message: 'Announcement created successfully'
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create announcement: ' + error.message
    });
  }
};

// Get all announcements
const getAllAnnouncements = async (req, res) => {
  try {
    const snapshot = await db.ref('announcements').once('value');
    const announcements = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        announcements.push(childSnapshot.val());
      });
    }

    // Sort by date (most recent first)
    announcements.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: announcements,
      count: announcements.length
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcements: ' + error.message
    });
  }
};

// Get announcement by ID
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const snapshot = await db.ref(`announcements/${id}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: snapshot.val()
    });

  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcement: ' + error.message
    });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, type } = req.body;

    // Check if announcement exists
    const snapshot = await db.ref(`announcements/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['announcement', 'event', 'holiday', 'meeting', 'reminder'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Type must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (date !== undefined) updateData.date = date.trim();
    if (type !== undefined) updateData.type = type.trim();

    // Update announcement
    await db.ref(`announcements/${id}`).update(updateData);

    // Get updated announcement
    const updatedSnapshot = await db.ref(`announcements/${id}`).once('value');
    const updatedAnnouncement = updatedSnapshot.val();

    res.json({
      success: true,
      data: updatedAnnouncement,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update announcement: ' + error.message
    });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if announcement exists
    const snapshot = await db.ref(`announcements/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    // Delete announcement
    await db.ref(`announcements/${id}`).remove();

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete announcement: ' + error.message
    });
  }
};

// Get announcements by date
const getAnnouncementsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const snapshot = await db.ref('announcements').orderByChild('date').equalTo(date).once('value');
    const announcements = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        announcements.push(childSnapshot.val());
      });
    }

    res.json({
      success: true,
      data: announcements,
      count: announcements.length
    });

  } catch (error) {
    console.error('Error fetching announcements by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcements by date: ' + error.message
    });
  }
};

// Get announcements by date range
const getAnnouncementsByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }

    const snapshot = await db.ref('announcements').once('value');
    const announcements = [];

    if (snapshot.exists()) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      snapshot.forEach((childSnapshot) => {
        const announcement = childSnapshot.val();
        const announcementDate = new Date(announcement.date);
        
        if (announcementDate >= startDate && announcementDate <= endDate) {
          announcements.push(announcement);
        }
      });
    }

    // Sort by date
    announcements.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: announcements,
      count: announcements.length
    });

  } catch (error) {
    console.error('Error fetching announcements by date range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcements by date range: ' + error.message
    });
  }
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByDate,
  getAnnouncementsByDateRange
};

