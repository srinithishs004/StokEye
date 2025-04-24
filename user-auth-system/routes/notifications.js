const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAdminNotifications,
  getUserNotifications,
  markAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// User routes
router.get('/', getUserNotifications);
router.put('/:id/read', markAsRead);

// Admin routes
router.post('/', admin, createNotification);
router.get('/admin', admin, getAdminNotifications);
router.delete('/:id', admin, deleteNotification);

module.exports = router;