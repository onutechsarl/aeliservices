const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    createService,
    getAllServicesGrouped,
    getServicesByProvider,
    updateService,
    deleteService,
    getCategoriesByProvider,
    deleteProviderCategory
} = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const {
    createCategoryValidation,
    createServiceValidation,
    updateServiceValidation
} = require('../validators/serviceValidator');
const { handleServicePhotoUpload } = require('../middlewares/upload');
const { validateUuidParam } = require('../middlewares/validateParams');

// ============ CATEGORY ROUTES ============

// Public
router.get('/categories', getCategories);

// Admin or Provider can create categories
router.post('/categories', protect, restrictTo('admin', 'provider'), createCategoryValidation, validate, createCategory);
router.put('/categories/:id', protect, restrictTo('admin'), validateUuidParam('id'), updateCategory);

// ============ SERVICE ROUTES ============

// Public
router.get('/', getAllServicesGrouped);
router.get('/provider/:providerId', validateUuidParam('providerId'), getServicesByProvider);
router.get('/provider/:providerId/categories', validateUuidParam('providerId'), getCategoriesByProvider);

// Provider only
router.post('/', protect, restrictTo('provider'), handleServicePhotoUpload, createServiceValidation, validate, createService);
router.put('/:id', protect, validateUuidParam('id'), handleServicePhotoUpload, updateServiceValidation, validate, updateService);
router.delete('/:id', protect, validateUuidParam('id'), deleteService);
router.delete('/provider/category/:categoryId', protect, restrictTo('provider'), validateUuidParam('categoryId'), deleteProviderCategory);

module.exports = router;
