const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Referral — tracks who referred whom and the reward state.
 *
 * One row is created at registration time when the new user submits a valid
 * referralCode. The row stays `pending` until the configured trigger fires
 * (email verified by default), at which point it becomes `rewarded` and a
 * subscription bonus is applied to the referrer.
 */
const Referral = sequelize.define(
    'Referral',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        referrerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'referrer_id',
            references: { model: 'users', key: 'id' }
        },
        referredUserId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            field: 'referred_user_id',
            references: { model: 'users', key: 'id' },
            comment: 'A user can only be referred once, ever.'
        },
        codeUsed: {
            type: DataTypes.STRING(40),
            allowNull: false,
            field: 'code_used',
            comment: 'Snapshot of the referrer code at the time of registration.'
        },
        status: {
            type: DataTypes.ENUM('pending', 'rewarded', 'revoked'),
            allowNull: false,
            defaultValue: 'pending'
        },
        rewardDays: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'reward_days'
        },
        rewardedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'rewarded_at'
        },
        revokedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'revoked_at'
        },
        revokedReason: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'revoked_reason'
        }
    },
    {
        tableName: 'referrals',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['referrer_id'] },
            { fields: ['status'] },
            { fields: ['rewarded_at'] }
        ]
    }
);

module.exports = Referral;
