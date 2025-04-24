const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Please provide a stock symbol'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a stock name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide a stock price']
  },
  previousPrice: {
    type: Number,
    required: [true, 'Please provide a previous stock price']
  },
  change: {
    type: Number
  },
  changePercent: {
    type: Number
  },
  sector: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Calculate change and change percent before saving
StockSchema.pre('save', function(next) {
  if (this.price && this.previousPrice) {
    this.change = parseFloat((this.price - this.previousPrice).toFixed(2));
    this.changePercent = parseFloat(((this.change / this.previousPrice) * 100).toFixed(2));
  }
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Stock', StockSchema);