const Notification = require('../models/Notification');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Stock = require('../models/Stock');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, stockId, targetUsers } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    // Validate stock if provided
    let stockRef = null;
    if (stockId) {
      // Try to find stock by ID first
      let stock = await Stock.findById(stockId);
      
      // If not found by ID, try to find by symbol
      if (!stock) {
        stock = await Stock.findOne({ symbol: stockId });
      }
      
      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Stock not found'
        });
      }
      
      stockRef = stock._id;
    }
    
    // Create notification
    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      stock: stockRef,
      targetUsers: targetUsers || 'all',
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all notifications for admin
// @route   GET /api/notifications/admin
// @access  Private/Admin
exports.getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('stock', 'symbol name')
      .populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    // Get user's favorite stocks
    const favorites = await Favorite.find({ user: req.user.id });
    const favoriteStockIds = favorites.map(fav => fav.stock.toString());
    
    // Find notifications for this user
    // Include: all notifications, notifications for stocks they have favorited
    const notifications = await Notification.find({
      $or: [
        { targetUsers: 'all' },
        { 
          targetUsers: 'favorites',
          stock: { $in: favoriteStockIds }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('stock', 'symbol name')
    .populate('createdBy', 'name');
    
    // Mark which ones are read by this user
    const notificationsWithReadStatus = notifications.map(notification => {
      const notificationObj = notification.toObject();
      notificationObj.isRead = notification.isRead.get(req.user.id.toString()) || false;
      return notificationObj;
    });
    
    res.status(200).json({
      success: true,
      count: notificationsWithReadStatus.length,
      data: notificationsWithReadStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Mark as read for this user
    notification.isRead.set(req.user.id.toString(), true);
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};