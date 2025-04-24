const Stock = require('../models/Stock');
const stockService = require('../services/stockService');
const nseStockService = require('../services/nseStockService');

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
    
    const { symbol, name, sector } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }
    
    let stock;
    const formattedSymbol = symbol.toUpperCase();
    
    // Check if it's an Indian stock (NSE)
    if (formattedSymbol.includes('.NSE') || formattedSymbol.endsWith('.NS')) {
      // Create stock using NSE API data
      stock = await nseStockService.createNseStock(
        formattedSymbol,
        name,
        sector
      );
    } else {
      // Create stock using Alpha Vantage API data for non-Indian stocks
      stock = await stockService.createStockWithApiData(
        formattedSymbol,
        name,
        sector
      );
    }
    
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
    
    const symbol = req.params.symbol.toUpperCase();
    const { name, sector, useApi } = req.body;
    
    // Find stock
    let stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    if (useApi) {
      // Update stock using appropriate API
      try {
        if (symbol.includes('.NSE') || symbol.endsWith('.NS')) {
          // Update using NSE API data
          stock = await nseStockService.updateNseStockData(symbol);
        } else {
          // Update using Alpha Vantage API data
          stock = await stockService.updateStockData(symbol);
        }
      } catch (apiError) {
        return res.status(500).json({
          success: false,
          message: 'Error updating stock from API',
          error: apiError.message
        });
      }
    }
    
    // Update other fields if provided
    if (name) stock.name = name;
    if (sector) stock.sector = sector;
    
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

// @desc    Refresh all stocks from API
// @route   POST /api/stocks/refresh
// @access  Private/Admin
exports.refreshStocks = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to refresh stocks' 
      });
    }
    
    // Get all stocks
    const stocks = await Stock.find();
    
    // Separate Indian and non-Indian stocks
    const indianStocks = stocks.filter(stock => 
      stock.symbol.includes('.NSE') || stock.symbol.endsWith('.NS')
    );
    
    const otherStocks = stocks.filter(stock => 
      !stock.symbol.includes('.NSE') && !stock.symbol.endsWith('.NS')
    );
    
    // Update stocks using appropriate services
    const nseResults = indianStocks.length > 0 
      ? await nseStockService.updateAllNseStocks() 
      : { success: [], failed: [] };
      
    const avResults = otherStocks.length > 0
      ? await stockService.updateAllStocks()
      : { success: [], failed: [] };
    
    // Combine results
    const results = {
      success: [...nseResults.success, ...avResults.success],
      failed: [...nseResults.failed, ...avResults.failed]
    };
    
    res.status(200).json({
      success: true,
      message: 'Stock refresh initiated',
      data: results
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

// @desc    Get historical data for a stock
// @route   GET /api/stocks/:symbol/history
// @access  Public
exports.getStockHistory = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Get historical data from appropriate service
    let historicalData;
    
    if (symbol.includes('.NSE') || symbol.endsWith('.NS')) {
      // Get NSE historical data
      historicalData = await nseStockService.getNseStockHistoricalData(symbol);
    } else {
      // Get Alpha Vantage historical data
      historicalData = await stockService.getStockHistoricalData(symbol);
    }
    
    res.status(200).json({
      success: true,
      data: historicalData
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