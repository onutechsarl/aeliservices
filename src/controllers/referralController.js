const { Op } = require('sequelize');
const { Referral, User } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { i18nResponse, getPaginationParams, getPaginationData, getFrontendUrl } = require('../utils/helpers');

const VALID_STATUSES = new Set(['pending', 'rewarded', 'revoked']);

/**
 * Mask a referred user's full name to "Prénom I." for privacy.
 */
const maskName = (firstName, lastName) => {
    const first = firstName || '';
    const initial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : '';
    return [first, initial].filter(Boolean).join(' ');
};

/**
 * @desc    Get the current user's referral code + shareable URL
 * @route   GET /api/users/me/referral
 * @access  Private
 */
const getMyReferralCode = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'role', 'referralCode']
    });
    if (!user) throw new AppError(req.t('user.notFound'), 404);

    const base = getFrontendUrl(user.role);
    const shareUrl = user.referralCode
        ? `${base.replace(/\/$/, '')}/register?ref=${encodeURIComponent(user.referralCode)}`
        : null;

    i18nResponse(req, res, 200, 'common.details', {
        referralCode: user.referralCode,
        shareUrl
    });
});

/**
 * @desc    Paginated list of the current user's referrals
 * @route   GET /api/users/me/referrals
 * @access  Private
 */
const getMyReferrals = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const { limit: queryLimit, offset } = getPaginationParams(page, limit);

    const where = { referrerId: req.user.id };
    if (status && VALID_STATUSES.has(status)) {
        where.status = status;
    }

    const { count, rows } = await Referral.findAndCountAll({
        where,
        attributes: [
            'id', 'status', 'codeUsed', 'rewardDays',
            'rewardedAt', 'revokedAt', 'revokedReason', 'createdAt'
        ],
        include: [
            {
                model: User,
                as: 'referredUser',
                attributes: ['id', 'firstName', 'lastName', 'isEmailVerified']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: queryLimit,
        offset
    });

    const referrals = rows.map((r) => {
        const ref = r.toJSON();
        const referred = ref.referredUser || {};
        return {
            id: ref.id,
            status: ref.status,
            codeUsed: ref.codeUsed,
            rewardDays: ref.rewardDays,
            rewardedAt: ref.rewardedAt,
            revokedAt: ref.revokedAt,
            revokedReason: ref.revokedReason,
            createdAt: ref.createdAt,
            referredUser: {
                displayName: maskName(referred.firstName, referred.lastName),
                isEmailVerified: !!referred.isEmailVerified
            }
        };
    });

    const pagination = getPaginationData(page, queryLimit, count);
    i18nResponse(req, res, 200, 'common.list', { referrals, pagination });
});

/**
 * @desc    Aggregated stats on the current user's referrals
 * @route   GET /api/users/me/referrals/stats
 * @access  Private
 */
const getMyReferralStats = asyncHandler(async (req, res) => {
    const [counts, rewardedRows] = await Promise.all([
        Referral.findAll({
            where: { referrerId: req.user.id },
            attributes: ['status'],
            raw: true
        }),
        Referral.findAll({
            where: { referrerId: req.user.id, status: 'rewarded' },
            attributes: ['rewardDays'],
            raw: true
        })
    ]);

    const stats = {
        total: counts.length,
        pending: 0,
        rewarded: 0,
        revoked: 0,
        totalDaysEarned: 0
    };
    for (const row of counts) {
        if (stats[row.status] !== undefined) stats[row.status] += 1;
    }
    stats.totalDaysEarned = rewardedRows.reduce(
        (acc, r) => acc + (Number(r.rewardDays) || 0),
        0
    );

    i18nResponse(req, res, 200, 'common.details', { stats });
});

module.exports = {
    getMyReferralCode,
    getMyReferrals,
    getMyReferralStats
};
