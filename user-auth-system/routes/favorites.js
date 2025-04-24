const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getFavorites)
  .post(addFavorite);

router.route('/:id')
  .delete(removeFavorite);

router.get('/check/:stockId', checkFavorite);

module.exports = router;