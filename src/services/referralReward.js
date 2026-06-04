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

/**
 * Roll back the bonus given for `referredUserId` if the user is leaving the
 * platform within the configured window (`referral.rollbackWindowDays`).
 *
 * Called when a user is soft-deactivated or hard-deleted. Idempotent — if
 * the referral isn't in 'rewarded' state or the window has passed, this is
 * a no-op. Failures are swallowed so they never block the account closure.
 *
 * Returns: { status: 'rolled_back' | 'noop' | 'error', reason? }
 */
const rollbackIfApplicable = async (referredUserId, { req } = {}) => {
    try {
        const referral = await Referral.findOne({
            where: { referredUserId, status: 'rewarded' }
        });
        if (!referral) return { status: 'noop' };

        const windowDays = await getSetting('referral.rollbackWindowDays', 30);
        if (!windowDays || windowDays <= 0) {
            return { status: 'noop', reason: 'rollback disabled' };
        }

        const rewardedAt = referral.rewardedAt ? new Date(referral.rewardedAt) : null;
        if (!rewardedAt) return { status: 'noop' };
        const ageDays = (Date.now() - rewardedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > windowDays) {
            return { status: 'noop', reason: 'window expired' };
        }

        const referrer = await User.findByPk(referral.referrerId);
        if (referrer) {
            const provider = await Provider.findOne({
                where: { userId: referrer.id },
                attributes: ['id']
            });
            if (provider && referral.rewardDays) {
                await Subscription.removeBonusDays(provider.id, referral.rewardDays);
            }
        }

        referral.status = 'revoked';
        referral.revokedAt = new Date();
        referral.revokedReason = 'Referred user left within rollback window';
        await referral.save({
            fields: ['status', 'revokedAt', 'revokedReason']
        });

        AuditLog.log({
            userId: referral.referrerId,
            action: 'rollback',
            entityType: 'Referral',
            entityId: referral.id,
            oldValues: { status: 'rewarded', rewardDays: referral.rewardDays },
            newValues: { status: 'revoked', reason: referral.revokedReason },
            req
        }).catch(() => null);

        return { status: 'rolled_back', days: referral.rewardDays };
    } catch (err) {
        logger.error('Referral rollback failed', {
            referredUserId,
            error: err.message,
            stack: err.stack
        });
        return { status: 'error', reason: err.message };
    }
};

module.exports = { attemptReward, rollbackIfApplicable };
