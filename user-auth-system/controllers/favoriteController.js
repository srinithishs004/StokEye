const Favorite = require('../models/Favorite');
const Stock = require('../models/Stock');

// @desc    Add a stock to user's favorites
// @route   POST /api/favorites
// @access  Private
exports.addFavorite = async (req, res) => {
  try {
    const { stockId } = req.body;
    
    if (!stockId) {
      return res.status(400).json({
        success: false,
        message: 'Stock ID is required'
      });
    }
    
    // Check if stock exists
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }
    
    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      user: req.user.id,
      stock: stockId
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Stock already in favorites'
      });
    }
    
    // Add to favorites
    const favorite = await Favorite.create({
      user: req.user.id,
      stock: stockId
    });
    
    res.status(201).json({
      success: true,
      data: favorite
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

// @desc    Remove a stock from user's favorites
// @route   DELETE /api/favorites/:id
// @access  Private
exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    await favorite.deleteOne();
    
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

// @desc    Get user's favorite stocks
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('stock')
      .sort({ addedAt: -1 });
    
    // Extract just the stock data
    const favoriteStocks = favorites.map(fav => ({
      ...fav.stock.toObject(),
      favoriteId: fav._id
    }));
    
    res.status(200).json({
      success: true,
      count: favoriteStocks.length,
      data: favoriteStocks
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

// @desc    Check if a stock is in user's favorites
// @route   GET /api/favorites/check/:stockId
// @access  Private
exports.checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user.id,
      stock: req.params.stockId
    });
    
    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
      data: favorite
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