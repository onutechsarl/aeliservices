const express = require('express');
const router = express.Router();
const {
    createReview,
    getProviderReviews,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { validateUuidParam } = require('../middlewares/validateParams');
const { body } = require('express-validator');

// Review validation
const reviewValidation = [
    body('providerId')
        .notEmpty()
        .withMessage('L\'ID du prestataire est requis')
        .isUUID()
        .withMessage('ID invalide'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('La note doit être entre 1 et 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Le commentaire ne peut pas dépasser 1000 caractères')
];

const updateReviewValidation = [
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('La note doit être entre 1 et 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Le commentaire ne peut pas dépasser 1000 caractères')
];

// Public routes
router.get('/provider/:providerId', validateUuidParam('providerId'), getProviderReviews);

// Protected routes
router.post('/', protect, reviewValidation, validate, createReview);
router.put('/:id', protect, validateUuidParam('id'), updateReviewValidation, validate, updateReview);
router.delete('/:id', protect, validateUuidParam('id'), deleteReview);

module.exports = router;
