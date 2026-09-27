/**
 * Cron Jobs for AELI Services
 * Scheduled tasks for subscription management and cleanup
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { Subscription } = require('../models');
const { sendExpirationReminders } = require('../controllers/subscriptionController');

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    logger.info('📅 Initializing cron jobs...');

    // ==================== SUBSCRIPTION JOBS ====================

    /**
     * Expire old subscriptions - Daily at 00:01
     * Marks subscriptions as expired when endDate < now
     */
    cron.schedule('1 0 * * *', async () => {
        logger.info('[CRON] Running subscription expiration check...');
        try {
            const expiredCount = await Subscription.expireOldSubscriptions();
            logger.info(`[CRON] Expired ${expiredCount} subscriptions`);
        } catch (error) {
            logger.error('[CRON] Subscription expiration error:', error.message);
        }
    }, {
        scheduled: true,
        timezone: 'Africa/Douala'
    });

    /**
     * Send expiration reminders - Daily at 09:00
     * Sends email reminders 7 days before expiration
     */
    cron.schedule('0 9 * * *', async () => {
        logger.info('[CRON] Running expiration reminders...');
        try {
            const sentCount = await sendExpirationReminders();
            logger.info(`[CRON] Sent ${sentCount} reminder emails`);
        } catch (error) {
            logger.error('[CRON] Reminder emails error:', error.message);
        }
    }, {
        scheduled: true,
        timezone: 'Africa/Douala'
    });

    // ==================== CLEANUP JOBS ====================

    /**
     * Clean expired refresh tokens - Every hour
     */
    cron.schedule('0 * * * *', async () => {
        logger.debug('[CRON] Cleaning expired refresh tokens...');
        try {
            const { RefreshToken } = require('../models');
            const { Op } = require('sequelize');

            const deleted = await RefreshToken.destroy({
                where: {
                    expiresAt: { [Op.lt]: new Date() }
                }
            });

            if (deleted > 0) {
                logger.info(`[CRON] Cleaned ${deleted} expired refresh tokens`);
            }
        } catch (error) {
            logger.error('[CRON] Token cleanup error:', error.message);
        }
    });

    /**
     * Clean old security logs - Daily at 03:00
     * Keeps only last 30 days of logs
     */
    cron.schedule('0 3 * * *', async () => {
        logger.info('[CRON] Cleaning old security logs...');
        try {
            const { SecurityLog } = require('../models');
            const { Op } = require('sequelize');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deleted = await SecurityLog.destroy({
                where: {
                    createdAt: { [Op.lt]: thirtyDaysAgo }
                }
            });

            if (deleted) logger.info(`[CRON] Cleaned ${deleted} old security logs`);
        } catch (error) {
            logger.error('[CRON] Security log cleanup error:', error.message);
        }
    }, {
        scheduled: true,
        timezone: 'Africa/Douala'
    });

    // Featuring is now permanent (client request): a provider stays featured
    // until an admin removes it, so the daily "un-feature expired providers"
    // job has been removed.

    /**
     * Unban expired IPs - Every 15 minutes
     */
    cron.schedule('*/15 * * * *', async () => {
        try {
            const { BannedIP } = require('../models');
            const { Op } = require('sequelize');

            const deleted = await BannedIP.destroy({
                where: {
                    expiresAt: {
                        [Op.and]: [
                            { [Op.not]: null },
                            { [Op.lt]: new Date() }
                        ]
                    }
                }
            });

            if (deleted > 0) {
                logger.info(`[CRON] Unbanned ${deleted} expired IPs`);
                // Clear cache
                const cache = require('../config/redis');
                await cache.del('banned-ips');
            }
        } catch (error) {
            logger.error('[CRON] IP unban error:', error.message);
        }
    });

    logger.info('✅ Cron jobs initialized');
};

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
    cron.getTasks().forEach(task => task.stop());
    logger.info('🛑 Cron jobs stopped');
};

module.exports = {
    initCronJobs,
    stopCronJobs
};
