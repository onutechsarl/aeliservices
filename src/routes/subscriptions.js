const express = require('express');
const router = express.Router();
const {
    getPlans,
    getMySubscription,
    subscribe,
    checkProviderStatus
} = require('../controllers/subscriptionController');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateUuidParam } = require('../middlewares/validateParams');

// Public routes
router.get('/plans', getPlans);
router.get('/provider/:providerId/status', validateUuidParam('providerId'), checkProviderStatus);

// Protected routes (provider only)
router.use(protect);
router.get('/my', getMySubscription);
router.post('/subscribe', restrictTo('provider'), subscribe);

module.exports = router;
