const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encrypt, decrypt, encryptIfNeeded } = require('../utils/encryption');

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null for unauthenticated users
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    providerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'provider_id',
        references: {
            model: 'providers',
            key: 'id'
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le message est requis'
            },
            len: {
                args: [10, 2000],
                msg: 'Le message doit contenir entre 10 et 2000 caractères'
            }
        }
    },
    senderName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'sender_name',
        validate: {
            notEmpty: {
                msg: 'Le nom est requis'
            }
        }
    },
    senderEmail: {
        type: DataTypes.STRING(500), // Increased for encrypted data
        allowNull: false,
        field: 'sender_email'
        // Note: Email validation happens before encryption in controller
    },
    senderPhone: {
        type: DataTypes.STRING(200), // Increased for encrypted data
        allowNull: true,
        field: 'sender_phone'
    },
    status: {
        type: DataTypes.ENUM('pending', 'read', 'replied'),
        defaultValue: 'pending'
    },
    isUnlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_unlocked',
        comment: 'Si true, le prestataire peut voir le message complet et les coordonnées'
    },
    unlockedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'unlocked_at',
        comment: 'Date de débloquage du message'
    },
    unlockPaymentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'unlock_payment_id',
        references: {
            model: 'payments',
            key: 'id'
        },
        comment: 'ID du paiement ayant débloqué ce message (si pay-per-view)'
    }
}, {
    tableName: 'contacts',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['provider_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ],
    hooks: {
        beforeCreate: (contact) => {
            if (contact.senderPhone) {
                contact.senderPhone = encryptIfNeeded(contact.senderPhone);
            }
            if (contact.senderEmail) {
                contact.senderEmail = encryptIfNeeded(contact.senderEmail);
            }
        },
        beforeUpdate: (contact) => {
            if (contact.changed('senderPhone') && contact.senderPhone) {
                contact.senderPhone = encryptIfNeeded(contact.senderPhone);
            }
            if (contact.changed('senderEmail') && contact.senderEmail) {
                contact.senderEmail = encryptIfNeeded(contact.senderEmail);
            }
        },
        afterFind: (result) => {
            if (!result) return;

            const decryptFields = (contact) => {
                if (contact) {
                    if (contact.senderPhone) {
                        contact.senderPhone = decrypt(contact.senderPhone);
                    }
                    if (contact.senderEmail) {
                        contact.senderEmail = decrypt(contact.senderEmail);
                    }
                }
            };

            if (Array.isArray(result)) {
                result.forEach(decryptFields);
            } else {
                decryptFields(result);
            }
        }
    }
});

/**
 * Check if contact can be viewed by user (checks subscription or unlock status)
 * @param {Object} user - User object with role
 * @returns {Promise<boolean>}
 */
Contact.prototype.canBeViewedBy = async function (user) {
    // Pay-per-view has been removed (client request): the recipient provider
    // can always read the full message and the sender's contact details, with
    // no subscription and no unlock payment required. Kept as a method so the
    // restriction can be reinstated later without touching the callers.
    return true;
};

/**
 * Get masked contact data (for locked messages)
 * @returns {Object}
 */
Contact.prototype.getMaskedData = function () {
    // Mask email: show first char + *** + domain
    let maskedEmail = '***@***';
    if (this.senderEmail) {
        const emailParts = this.senderEmail.split('@');
        if (emailParts.length === 2) {
            maskedEmail = `${emailParts[0][0]}***@***`;
        }
    }

    // Mask phone: show country code + ***
    let maskedPhone = null;
    if (this.senderPhone) {
        maskedPhone = '+237 6** *** ***';
    }

    return {
        id: this.id,
        messagePreview: this.message.substring(0, 50) + '...',
        senderName: this.senderName,
        senderEmail: maskedEmail,
        senderPhone: maskedPhone,
        status: this.status,
        isUnlocked: false,
        createdAt: this.createdAt,
        unlockPrice: 500, // FCFA
        needsUnlock: true
    };
};

module.exports = Contact;
