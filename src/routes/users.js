const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    deactivateAccount
} = require('../controllers/userController');
const {
    getMyReferralCode,
    getMyReferrals,
    getMyReferralStats
} = require('../controllers/referralController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { handleProfilePhotoUpload } = require('../middlewares/upload');
const { updateProfileValidation } = require('../validators/userValidator');
const { changePasswordValidation } = require('../validators/authValidator');

// All routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', handleProfilePhotoUpload, updateProfileValidation, validate, updateProfile);
router.put('/password', changePasswordValidation, validate, changePassword);
router.delete('/account', deactivateAccount);

// Referral dashboard (Phase 5)
router.get('/me/referral', getMyReferralCode);
router.get('/me/referrals', getMyReferrals);
router.get('/me/referrals/stats', getMyReferralStats);

module.exports = router;
