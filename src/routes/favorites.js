const express = require('express');
const router = express.Router();
const {
    addFavorite,
    getFavorites,
    removeFavorite,
    checkFavorite
} = require('../controllers/favoriteController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { validateUuidParam } = require('../middlewares/validateParams');
const { body } = require('express-validator');

// Validation
const addFavoriteValidation = [
    body('providerId')
        .notEmpty()
        .withMessage('L\'ID du prestataire est requis')
        .isUUID()
        .withMessage('ID invalide')
];

// All routes require authentication
router.use(protect);

router.post('/', addFavoriteValidation, validate, addFavorite);
router.get('/', getFavorites);
router.delete('/:providerId', validateUuidParam('providerId'), removeFavorite);
router.get('/check/:providerId', validateUuidParam('providerId'), checkFavorite);

module.exports = router;
