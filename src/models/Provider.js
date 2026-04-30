const { DataTypes } = require('sequelize');
const slugify = require('slugify');
const { sequelize } = require('../config/database');
const { encrypt, decrypt, encryptIfNeeded } = require('../utils/encryption');

const slugifyOptions = { lower: true, strict: true, locale: 'fr', trim: true };

const buildUniqueSlug = async (provider, baseName) => {
    const base = slugify(baseName || 'prestataire', slugifyOptions) || 'prestataire';
    let candidate = base;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await provider.constructor.findOne({
            where: { slug: candidate },
            attributes: ['id'],
            paranoid: false
        });
        if (!existing || existing.id === provider.id) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
};

const Provider = sequelize.define('Provider', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    businessName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'business_name',
        validate: {
            notEmpty: {
                msg: 'Le nom de l\'entreprise est requis'
            }
        }
    },
    slug: {
        type: DataTypes.STRING(280),
        allowNull: true,
        unique: true,
        comment: 'URL-friendly identifier for public profile sharing'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La description est requise'
            },
            len: {
                args: [50, 5000],
                msg: 'La description doit contenir entre 50 et 5000 caractères'
            }
        }
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La localisation est requise'
            }
        }
    },
    address: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    whatsapp: {
        type: DataTypes.STRING(200), // Increased for encrypted data
        allowNull: true
    },
    facebook: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    instagram: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    businessContact: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'business_contact',
        comment: 'Professional contact phone number for business activities'
    },
    photos: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
            isValidPhotos(value) {
                if (value && value.length > 5) {
                    throw new Error('Maximum 5 photos autorisées');
                }
            }
        }
    },
    activities: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of activities/services offered'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    profilePhoto: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_photo'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_featured'
    },
    featuredUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'featured_until'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
        comment: 'When false, provider is hidden from public listings'
    },
    viewsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'views_count'
    },
    contactsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'contacts_count'
    },
    averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00,
        field: 'average_rating'
    },
    totalReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_reviews'
    },
    // Document verification fields
    documents: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of uploaded documents: [{type, url, uploadedAt, status}]'
    },
    verificationStatus: {
        type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
        defaultValue: 'pending',
        field: 'verification_status'
    },
    verificationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'verification_notes',
        comment: 'Admin notes about verification decision'
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verified_at'
    },
    verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'verified_by',
        comment: 'Admin user ID who verified'
    }
}, {
    tableName: 'providers',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['location']
        },
        {
            fields: ['average_rating']
        },
        {
            fields: ['is_verified']
        },
        {
            fields: ['is_featured']
        }
    ],
    hooks: {
        beforeCreate: async (provider) => {
            if (provider.whatsapp) {
                provider.whatsapp = encryptIfNeeded(provider.whatsapp);
            }
            if (!provider.slug) {
                provider.slug = await buildUniqueSlug(provider, provider.businessName);
            }
        },
        beforeUpdate: async (provider) => {
            if (provider.changed('whatsapp') && provider.whatsapp) {
                provider.whatsapp = encryptIfNeeded(provider.whatsapp);
            }
            if (provider.changed('businessName') && !provider.changed('slug')) {
                provider.slug = await buildUniqueSlug(provider, provider.businessName);
            }
        },
        afterFind: (result) => {
            if (!result) return;

            const decryptWhatsapp = (provider) => {
                if (provider && provider.whatsapp) {
                    provider.whatsapp = decrypt(provider.whatsapp);
                }
            };

            if (Array.isArray(result)) {
                result.forEach(decryptWhatsapp);
            } else {
                decryptWhatsapp(result);
            }
        }
    }
});

// Decrypt whatsapp on serialization (covers Sequelize includes where afterFind doesn't fire)
Provider.prototype.toJSON = function () {
    const values = { ...this.get() };
    if (values.whatsapp) {
        values.whatsapp = decrypt(values.whatsapp);
    }
    return values;
};

// Method to increment view count
Provider.prototype.incrementViews = async function () {
    this.viewsCount += 1;
    await this.save({ fields: ['viewsCount'] });
};

// Method to increment contact count
Provider.prototype.incrementContacts = async function () {
    this.contactsCount += 1;
    await this.save({ fields: ['contactsCount'] });
};

// Method to update rating
Provider.prototype.updateRating = async function (newRating, isNewReview = true) {
    if (isNewReview) {
        const newTotal = this.totalReviews + 1;
        const currentSum = parseFloat(this.averageRating) * this.totalReviews;
        this.averageRating = ((currentSum + newRating) / newTotal).toFixed(2);
        this.totalReviews = newTotal;
    } else {
        // Recalculate from all reviews
        const Review = require('./Review');
        const reviews = await Review.findAll({
            where: { providerId: this.id, isVisible: true }
        });
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            this.averageRating = (sum / reviews.length).toFixed(2);
            this.totalReviews = reviews.length;
        } else {
            this.averageRating = 0;
            this.totalReviews = 0;
        }
    }
    await this.save({ fields: ['averageRating', 'totalReviews'] });
};

module.exports = Provider;
