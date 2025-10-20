const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByDate,
  getAnnouncementsByDateRange
} = require('../controllers/announcementController');

// Basic CRUD routes
router.post('/', createAnnouncement);
router.get('/', getAllAnnouncements);
router.get('/:id', getAnnouncementById);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

// Additional routes
router.get('/date/:date', getAnnouncementsByDate);
router.get('/range', getAnnouncementsByDateRange);

module.exports = router;

