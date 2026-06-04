const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PlatformSetting — key/value store for admin-tunable platform parameters.
 *
 * Values are stored as strings and cast at read time using `valueType`.
 * Edits are gated by admin auth on the API side and audited.
 */
const PlatformSetting = sequelize.define(
    'PlatformSetting',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        key: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true,
            comment: 'Dotted key, e.g. "referral.rewardDays"'
        },
        value: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: 'Raw string value, parsed using valueType on read'
        },
        valueType: {
            type: DataTypes.ENUM('int', 'float', 'bool', 'string', 'json'),
            allowNull: false,
            field: 'value_type'
        },
        defaultValue: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: 'default_value',
            comment: 'Default value as string — used by reset endpoint'
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        minValue: {
            type: DataTypes.STRING(120),
            allowNull: true,
            field: 'min_value',
            comment: 'For numeric types, lower bound (inclusive)'
        },
        maxValue: {
            type: DataTypes.STRING(120),
            allowNull: true,
            field: 'max_value',
            comment: 'For numeric types, upper bound (inclusive)'
        }
    },
    {
        tableName: 'platform_settings',
        timestamps: true,
        underscored: true,
        indexes: [{ unique: true, fields: ['key'] }]
    }
);

/**
 * Parse a raw string value according to the declared type.
 * Falls back to the raw string if parsing fails.
 */
PlatformSetting.parseValue = function (raw, type) {
    if (raw === null || raw === undefined) return raw;
    switch (type) {
        case 'int': {
            const n = parseInt(raw, 10);
            return Number.isNaN(n) ? null : n;
        }
        case 'float': {
            const n = parseFloat(raw);
            return Number.isNaN(n) ? null : n;
        }
        case 'bool':
            return raw === 'true' || raw === '1';
        case 'json':
            try {
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        case 'string':
        default:
            return raw;
    }
};

PlatformSetting.serializeValue = function (value, type) {
    if (value === null || value === undefined) return null;
    if (type === 'json') return JSON.stringify(value);
    return String(value);
};

PlatformSetting.prototype.toPublic = function () {
    return {
        key: this.key,
        value: PlatformSetting.parseValue(this.value, this.valueType),
        valueType: this.valueType,
        defaultValue: PlatformSetting.parseValue(this.defaultValue, this.valueType),
        description: this.description,
        minValue: this.minValue !== null
            ? PlatformSetting.parseValue(this.minValue, this.valueType)
            : null,
        maxValue: this.maxValue !== null
            ? PlatformSetting.parseValue(this.maxValue, this.valueType)
            : null,
        updatedAt: this.updatedAt
    };
};

module.exports = PlatformSetting;
