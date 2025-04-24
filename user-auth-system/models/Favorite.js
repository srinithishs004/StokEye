const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only favorite a stock once
FavoriteSchema.index({ user: 1, stock: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);