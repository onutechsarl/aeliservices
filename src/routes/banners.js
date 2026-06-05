const express = require('express');
const router = express.Router();
const {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/bannerController');
const { protect, restrictTo } = require('../middlewares/auth');
const { handleBannerUpload } = require('../middlewares/upload');
const { validateUuidParam } = require('../middlewares/validateParams');
const { cacheMiddleware } = require('../config/redis');

// Public routes
router.get('/', cacheMiddleware(1800), getActiveBanners);

// Protected Admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/admin', getAllBanners);
router.post('/', handleBannerUpload, createBanner);
router.put('/:id', validateUuidParam('id'), handleBannerUpload, updateBanner);
router.delete('/:id', validateUuidParam('id'), deleteBanner);

module.exports = router;
