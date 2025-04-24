const Stock = require('../models/Stock');

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public
exports.getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ symbol: 1 });
    
    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
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

// @desc    Get single stock
// @route   GET /api/stocks/:symbol
// @access  Public
exports.getStock = async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: stock
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

// @desc    Create a stock
// @route   POST /api/stocks
// @access  Private/Admin
exports.createStock = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to create stocks' 
      });
    }
    
    const { symbol, name, price, previousPrice, sector } = req.body;
    
    // Check if stock already exists
    const stockExists = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (stockExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock already exists' 
      });
    }
    
    // Create stock
    const stock = await Stock.create({
      symbol: symbol.toUpperCase(),
      name,
      price,
      previousPrice,
      sector
    });
    
    res.status(201).json({
      success: true,
      data: stock
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

// @desc    Update a stock
// @route   PUT /api/stocks/:symbol
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update stocks' 
      });
    }
    
    const { price, previousPrice } = req.body;
    
    // Find stock
    let stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    // Update stock
    stock.price = price || stock.price;
    stock.previousPrice = previousPrice || stock.previousPrice;
    
    // If other fields are provided, update them
    if (req.body.name) stock.name = req.body.name;
    if (req.body.sector) stock.sector = req.body.sector;
    
    await stock.save();
    
    res.status(200).json({
      success: true,
      data: stock
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

// @desc    Delete a stock
// @route   DELETE /api/stocks/:symbol
// @access  Private/Admin
exports.deleteStock = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete stocks' 
      });
    }
    
    // Find stock
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    await stock.deleteOne();
    
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