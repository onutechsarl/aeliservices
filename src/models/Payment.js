const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PAYMENT_STATUS } = require('../config/cinetpay');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Gateway transaction reference
    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'transaction_id'
    },
    // Payment gateway used
    gateway: {
        type: DataTypes.ENUM('CinetPay', 'NotchPay'),
        allowNull: false,
        defaultValue: 'CinetPay'
    },
    // User who made the payment
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Provider receiving the payment (if applicable)
    providerId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'provider_id',
        references: {
            model: 'providers',
            key: 'id'
        }
    },
    // Payment type
    type: {
        type: DataTypes.ENUM('contact_premium', 'featured', 'boost', 'subscription', 'contact_unlock'),
        allowNull: false,
        defaultValue: 'contact_premium'
    },
    // Amount in local currency
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 100,
            isMultipleOfFive(value) {
                if (value % 5 !== 0) {
                    throw new Error('Le montant doit être un multiple de 5');
                }
            }
        }
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'XAF'
    },
    // Payment status
    status: {
        type: DataTypes.ENUM(
            'PENDING',
            'WAITING_CUSTOMER',
            'ACCEPTED',
            'REFUSED',
            'CANCELLED',
            'EXPIRED'
        ),
        defaultValue: 'PENDING'
    },
    // Payment method used
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'payment_method',
        comment: 'OM, MOMO, MTNCM, VISAM, etc.'
    },
    // Phone number used for payment
    phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'phone_number'
    },
    // CinetPay payment token
    paymentToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'payment_token'
    },
    // CinetPay payment URL
    paymentUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'payment_url'
    },
    // Operator transaction ID
    operatorId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'operator_id'
    },
    // Description
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // Metadata (JSON)
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    // Error message if failed
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
    },
    // Payment completed at
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at'
    },
    // Fund availability date
    fundAvailabilityDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'fund_availability_date'
    }
}, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['transaction_id'], unique: true },
        { fields: ['user_id'] },
        { fields: ['provider_id'] },
        { fields: ['status'] },
        { fields: ['type'] },
        { fields: ['created_at'] }
    ]
});

/**
 * Generate unique transaction ID
 */
Payment.generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `AELI${timestamp}${random}`;
};

/**
 * Find payment by transaction ID
 */
Payment.findByTransactionId = async function (transactionId) {
    return await this.findOne({ where: { transactionId } });
};

/**
 * Update payment status from CinetPay response
 */
Payment.prototype.updateFromCinetPay = async function (cinetpayData) {
    const statusMap = {
        'ACCEPTED': 'ACCEPTED',
        'REFUSED': 'REFUSED',
        'WAITING_FOR_CUSTOMER': 'WAITING_CUSTOMER'
    };

    this.status = statusMap[cinetpayData.status] || this.status;
    this.paymentMethod = cinetpayData.payment_method || this.paymentMethod;
    this.operatorId = cinetpayData.operator_id || this.operatorId;

    if (cinetpayData.status === 'ACCEPTED') {
        this.paidAt = cinetpayData.payment_date ? new Date(cinetpayData.payment_date) : new Date();
    }

    if (cinetpayData.fund_availability_date) {
        this.fundAvailabilityDate = new Date(cinetpayData.fund_availability_date);
    }

    await this.save();
    return this;
};

/**
 * Update payment status from NotchPay response/webhook
 */
Payment.prototype.updateFromNotchPay = async function (notchpayData, options = {}) {
    const { NOTCH_PAY_STATUS } = require('../config/notchpay');

    this.status = NOTCH_PAY_STATUS[notchpayData.status] || this.status;
    this.operatorId = notchpayData.payment_method?.reference || this.operatorId;
    this.paymentMethod = notchpayData.payment_method?.channel || this.paymentMethod;

    if (notchpayData.status === 'complete') {
        this.paidAt = notchpayData.completed_at ? new Date(notchpayData.completed_at) : new Date();
    }

    await this.save(options);
    return this;
};

/**
 * Verify that the amount/currency reported by the gateway matches what was
 * recorded when the payment was initialized. Returns { ok, message }.
 *
 * The gateway payload is attacker-influenced on the wire (before signature
 * verification) and, more importantly, protects against a mis-configured or
 * tampered checkout: we never activate a subscription that was paid for a
 * different amount. Fields absent from the payload are not checked.
 */
Payment.prototype.matchesGatewayAmount = function (gatewayData = {}) {
    if (gatewayData.amount !== undefined && gatewayData.amount !== null) {
        const reported = Number(gatewayData.amount);
        if (!Number.isFinite(reported) || reported !== Number(this.amount)) {
            return { ok: false, message: `amount mismatch (expected ${this.amount}, got ${gatewayData.amount})` };
        }
    }
    if (gatewayData.currency) {
        if (String(gatewayData.currency).toUpperCase() !== String(this.currency).toUpperCase()) {
            return { ok: false, message: `currency mismatch (expected ${this.currency}, got ${gatewayData.currency})` };
        }
    }
    return { ok: true };
};

module.exports = Payment;
