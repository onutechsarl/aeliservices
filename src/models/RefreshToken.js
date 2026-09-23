const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * RefreshToken model for storing refresh tokens
 * Used for token refresh mechanism and logout/blacklist
 */
const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    token: {
        // Stores the SHA-256 hash of the refresh token, never the token itself.
        // A DB leak therefore does not hand out usable refresh tokens.
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at'
    },
    isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_revoked'
    },
    revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'user_agent'
    },
    ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ip_address'
    },
    lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_used_at'
    }
}, {
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['token'] },
        { fields: ['expires_at'] },
        { fields: ['is_revoked'] }
    ]
});

/**
 * Hash a raw refresh token for storage/lookup. SHA-256 of a 512-bit random
 * token: not reversible, and deterministic so we can look it up by hash.
 */
RefreshToken.hashToken = function (raw) {
    return crypto.createHash('sha256').update(String(raw)).digest('hex');
};

/**
 * Issue a new refresh token: returns the RAW token (to hand to the client)
 * while persisting only its hash. Accepts an optional transaction.
 */
RefreshToken.issue = async function ({ userId, userAgent, ipAddress, ttlMs, transaction } = {}) {
    const raw = crypto.randomBytes(64).toString('hex');
    const record = await this.create(
        {
            userId,
            token: this.hashToken(raw),
            expiresAt: new Date(Date.now() + (ttlMs || REFRESH_TOKEN_TTL_MS)),
            userAgent,
            ipAddress
        },
        { transaction }
    );
    return { raw, record };
};

/**
 * Find a stored token record by its raw (client-supplied) value.
 */
RefreshToken.findByRawToken = async function (raw, options = {}) {
    if (!raw) return null;
    return this.findOne({ where: { token: this.hashToken(raw) }, ...options });
};

/**
 * Clean up expired tokens (run periodically)
 */
RefreshToken.cleanupExpired = async function () {
    const { Op } = require('sequelize');
    return await this.destroy({
        where: {
            [Op.or]: [
                { expiresAt: { [Op.lt]: new Date() } },
                { isRevoked: true, revokedAt: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            ]
        }
    });
};

/**
 * Revoke all tokens for a user (logout from all devices)
 */
RefreshToken.revokeAllForUser = async function (userId) {
    return await this.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { userId, isRevoked: false } }
    );
};

module.exports = RefreshToken;
