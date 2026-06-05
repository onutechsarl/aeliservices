const express = require('express');
const router = express.Router();
const {
    createContact,
    getReceivedContacts,
    getSentContacts,
    updateContactStatus,
    getDailyContactStats,
    getContactsByDate,
    initiateContactUnlock,
    confirmContactUnlock
} = require('../controllers/contactController');
const { protect, optionalAuth, restrictTo } = require('../middlewares/auth');
const { contactLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validation');
const { validateUuidParam } = require('../middlewares/validateParams');
const { body } = require('express-validator');

// Contact validation
const contactValidation = [
    body('providerId')
        .notEmpty()
        .withMessage('L\'ID du prestataire est requis')
        .isUUID()
        .withMessage('ID invalide'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Le message est requis')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Le message doit contenir entre 10 et 2000 caractères'),
    body('senderName')
        .trim()
        .notEmpty()
        .withMessage('Votre nom est requis')
        .isLength({ max: 200 })
        .withMessage('Le nom ne peut pas dépasser 200 caractères'),
    body('senderEmail')
        .trim()
        .isEmail()
        .withMessage('Veuillez fournir un email valide')
        .normalizeEmail(),
    body('senderPhone')
        .optional()
        .trim()
];

// Public route (with optional auth)
router.post('/', contactLimiter, optionalAuth, contactValidation, validate, createContact);

// Protected routes
router.get('/received', protect, restrictTo('provider'), getReceivedContacts);
router.get('/sent', protect, getSentContacts);
router.put('/:id/status', protect, validateUuidParam('id'), updateContactStatus);

// Provider dashboard routes - daily stats
router.get('/stats/daily', protect, restrictTo('provider'), getDailyContactStats);
router.get('/by-date/:date', protect, restrictTo('provider'), getContactsByDate);

// Contact unlock routes (pay-per-view)
router.post('/:id/unlock', protect, restrictTo('provider'), validateUuidParam('id'), initiateContactUnlock);
router.post('/:id/unlock/confirm', protect, restrictTo('provider'), validateUuidParam('id'), confirmContactUnlock);

module.exports = router;

