const { Op } = require('sequelize');
const { Referral, User, Provider, Subscription, AuditLog } = require('../models');
const { getSetting } = require('../utils/settings');
const { sendEmailSafely } = require('../utils/helpers');
const { referralRewardedEmail } = require('../utils/emailTemplates');
const logger = require('../utils/logger');

/**
 * Try to apply the referral reward triggered by `referredUserId`.
 *
 * Idempotent: if no `pending` Referral exists for the given user, this is a
 * no-op. Failures never bubble up — referral logic must never block the
 * primary flow (registration / OTP verification).
 *
 * Returns: { status: 'rewarded' | 'revoked' | 'noop', reason?, days?, subscription? }
 */
const attemptReward = async (referredUserId, { req } = {}) => {
    try {
        const referral = await Referral.findOne({
            where: { referredUserId, status: 'pending' }
        });
        if (!referral) return { status: 'noop' };

        const referrer = await User.findByPk(referral.referrerId);
        if (!referrer) {
            await markRevoked(referral, 'Referrer no longer exists');
            return { status: 'revoked', reason: 'Referrer no longer exists' };
        }

        if (!referrer.isActive) {
            await markRevoked(referral, 'Referrer is inactive');
            return { status: 'revoked', reason: 'Referrer is inactive' };
        }

        // Monthly cap check
        const monthlyCap = await getSetting('referral.monthlyCap', 20);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const rewardedInWindow = await Referral.count({
            where: {
                referrerId: referrer.id,
                status: 'rewarded',
                rewardedAt: { [Op.gte]: since }
            }
        });
        if (rewardedInWindow >= monthlyCap) {
            await markRevoked(referral, `Monthly cap reached (${monthlyCap})`);
            return { status: 'revoked', reason: 'Monthly cap reached' };
        }

        // Bonus applies only if the referrer has a Provider profile.
        const provider = await Provider.findOne({
            where: { userId: referrer.id },
            attributes: ['id']
        });
        if (!provider) {
            await markRevoked(referral, 'Referrer is not a provider');
            return { status: 'revoked', reason: 'Referrer is not a provider' };
        }

        const days = await getSetting('referral.rewardDays', 7);
        const subscription = await Subscription.applyBonusDays(provider.id, days);

        referral.status = 'rewarded';
        referral.rewardDays = days;
        referral.rewardedAt = new Date();
        await referral.save({ fields: ['status', 'rewardDays', 'rewardedAt'] });

        // Audit (best-effort, never blocks)
        AuditLog.log({
            userId: referrer.id,
            action: 'reward',
            entityType: 'Referral',
            entityId: referral.id,
            newValues: { days, providerId: provider.id, subscriptionId: subscription.id },
            req
        }).catch(() => null);

        // Notification email (best-effort)
        sendEmailSafely(
            {
                to: referrer.email,
                ...referralRewardedEmail({
                    firstName: referrer.firstName,
                    days,
                    endDate: subscription.endDate
                })
            },
            'Referral reward'
        ).catch(() => null);

        return { status: 'rewarded', days, subscription };
    } catch (err) {
        logger.error('Referral reward attempt failed', {
            referredUserId,
            error: err.message,
            stack: err.stack
        });
        return { status: 'error', reason: err.message };
    }
};

const markRevoked = async (referral, reason) => {
    referral.status = 'revoked';
    referral.revokedAt = new Date();
    referral.revokedReason = reason;
    await referral.save({ fields: ['status', 'revokedAt', 'revokedReason'] });
};

module.exports = { attemptReward };
