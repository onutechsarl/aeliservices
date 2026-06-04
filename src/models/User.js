const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt, encryptIfNeeded } = require('../utils/encryption');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Veuillez fournir un email valide'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: {
                args: [8, 255],
                msg: 'Le mot de passe doit contenir au moins 8 caractères'
            }
        }
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
        validate: {
            notEmpty: {
                msg: 'Le prénom est requis'
            }
        }
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
        validate: {
            notEmpty: {
                msg: 'Le nom est requis'
            }
        }
    },
    phone: {
        type: DataTypes.STRING(200), // Increased for encrypted data
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Cameroun',
        validate: {
            len: {
                args: [2, 100],
                msg: 'Le nom du pays doit contenir entre 2 et 100 caractères'
            }
        }
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('client', 'provider', 'admin'),
        defaultValue: 'client'
    },
    profilePhoto: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_photo'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_email_verified'
    },
    resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reset_password_token'
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reset_password_expires'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
    },
    // OTP fields for email verification
    otpCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'otp_code',
        comment: 'Hashed OTP code'
    },
    otpExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'otp_expires'
    },
    otpAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'otp_attempts',
        comment: 'Failed OTP verification attempts'
    },
    // Account lockout fields
    failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'failed_login_attempts'
    },
    lockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'locked_until',
        comment: 'Account locked until this time'
    },
    // Session tracking
    lastActivity: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_activity',
        comment: 'Last user activity timestamp for session timeout'
    },
    // Referral program
    referralCode: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: true,
        field: 'referral_code',
        comment: 'Shareable code so new users can register through this user.'
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                // Vérifier si le mot de passe est déjà un hash bcrypt
                const isAlreadyHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');

                if (!isAlreadyHashed) {
                    // Hasher seulement si ce n'est pas déjà un hash
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
            // Encrypt phone
            if (user.phone) {
                user.phone = encryptIfNeeded(user.phone);
            }
            // Auto-generate a unique referral code if not already provided
            if (!user.referralCode) {
                const { generateUniqueReferralCode } = require('../utils/referralCode');
                user.referralCode = await generateUniqueReferralCode(user.constructor);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
            // Encrypt phone if changed
            if (user.changed('phone') && user.phone) {
                user.phone = encryptIfNeeded(user.phone);
            }
        },
        afterFind: (result) => {
            if (!result) return;

            const decryptPhone = (user) => {
                if (user && user.phone) {
                    user.phone = decrypt(user.phone);
                }
            };

            if (Array.isArray(result)) {
                result.forEach(decryptPhone);
            } else {
                decryptPhone(result);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (without sensitive data)
User.prototype.toPublicJSON = function () {
    return {
        id: this.id,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        phone: decrypt(this.phone),
        country: this.country,
        gender: this.gender,
        role: this.role,
        profilePhoto: this.profilePhoto,
        isActive: this.isActive,
        isEmailVerified: this.isEmailVerified,
        referralCode: this.referralCode,
        createdAt: this.createdAt
    };
};

module.exports = User;
