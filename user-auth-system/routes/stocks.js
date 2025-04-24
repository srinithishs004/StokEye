const express = require('express');
const router = express.Router();
const { 
  getStocks, 
  getStock, 
  createStock, 
  updateStock, 
  deleteStock,
  refreshStocks,
  getStockHistory
} = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getStocks);
router.get('/:symbol', getStock);
router.get('/:symbol/history', getStockHistory);

// Protected routes (admin only)
router.post('/', protect, createStock);
router.put('/:symbol', protect, updateStock);
router.delete('/:symbol', protect, deleteStock);
router.post('/refresh', protect, refreshStocks);

module.exports = router;