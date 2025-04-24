const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'alert', 'success'],
    default: 'info'
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: false
  },
  targetUsers: {
    type: String,
    enum: ['all', 'specific', 'favorites'],
    default: 'all'
  },
  isRead: {
    type: Map,
    of: Boolean,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);