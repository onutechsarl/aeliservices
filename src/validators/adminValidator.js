const { body, param } = require('express-validator');

/**
 * Validate user status update
 */
const updateUserStatusValidation = [
    param('id')
        .isUUID()
        .withMessage('ID utilisateur invalide'),
    body('isActive')
        .isBoolean()
        .withMessage('isActive doit être un booléen')
];

/**
 * Validate provider verification
 */
const verifyProviderValidation = [
    param('id')
        .isUUID()
        .withMessage('ID prestataire invalide'),
    body('isVerified')
        .isBoolean()
        .withMessage('isVerified doit être un booléen'),
    body('rejectionReason')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Le motif de rejet doit contenir entre 5 et 500 caractères')
];

/**
 * Validate provider featuring
 */
const featureProviderValidation = [
    param('id')
        .isUUID()
        .withMessage('ID prestataire invalide'),
    body('isFeatured')
        .isBoolean()
        .withMessage('isFeatured doit être un booléen')
    // `duration` is no longer accepted: featuring is permanent until an admin
    // removes it. Any duration sent by an old client is simply ignored.
];

/**
 * Validate review visibility
 */
const updateReviewVisibilityValidation = [
    param('id')
        .isUUID()
        .withMessage('ID avis invalide'),
    body('isVisible')
        .isBoolean()
        .withMessage('isVisible doit être un booléen')
];

/**
 * Validate category creation/update
 */
const categoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Le nom de la catégorie est requis')
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La description ne peut pas dépasser 500 caractères'),
    body('icon')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('L\'icône ne peut pas dépasser 50 caractères'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('L\'ordre doit être un entier positif'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen')
];

/**
 * Validate category update
 */
const updateCategoryValidation = [
    param('id')
        .isUUID()
        .withMessage('ID catégorie invalide'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('description')
        .optional()
        .trim(),
    body('icon')
        .optional()
        .trim(),
    body('order')
        .optional()
        .isInt({ min: 0 }),
    body('isActive')
        .optional()
        .isBoolean()
];

/**
 * Validate user deletion
 */
const deleteUserValidation = [
    param('id')
        .isUUID()
        .withMessage('ID utilisateur invalide')
];

/**
 * Validate provider status toggle
 */
const toggleProviderStatusValidation = [
    param('id')
        .isUUID()
        .withMessage('ID prestataire invalide'),
    body('isActive')
        .isBoolean()
        .withMessage('isActive doit être un booléen'),
    body('reason')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('La raison doit contenir entre 5 et 500 caractères')
];

/**
 * Validate provider documents review
 */
const reviewProviderDocumentsValidation = [
    param('id')
        .isUUID()
        .withMessage('ID prestataire invalide'),
    body('decision')
        .isIn(['approved', 'rejected', 'under_review'])
        .withMessage('Décision invalide. Choisissez: approved, rejected ou under_review'),
    body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
    body('approvedDocuments')
        .optional()
        .isArray()
        .withMessage('approvedDocuments doit être un tableau d\'index'),
    body('approvedDocuments.*')
        .isInt({ min: 0 })
        .withMessage('Les index de documents approuvés doivent être des entiers positifs'),
    body('rejectedDocuments')
        .optional()
        .isArray()
        .withMessage('rejectedDocuments doit être un tableau d\'objets'),
    body('rejectedDocuments.*.index')
        .isInt({ min: 0 })
        .withMessage('L\'index du document rejeté doit être un entier positif'),
    body('rejectedDocuments.*.reason')
        .notEmpty()
        .withMessage('La raison du rejet est requise pour chaque document rejeté')
        .isString()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Le motif de rejet doit contenir entre 5 et 500 caractères')
];

module.exports = {
    updateUserStatusValidation,
    verifyProviderValidation,
    featureProviderValidation,
    updateReviewVisibilityValidation,
    categoryValidation,
    updateCategoryValidation,
    deleteUserValidation,
    toggleProviderStatusValidation,
    reviewProviderDocumentsValidation
};
