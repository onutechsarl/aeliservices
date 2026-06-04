const { sequelize } = require('../config/database');
const User = require('./User');
const Provider = require('./Provider');
const Category = require('./Category');
const Service = require('./Service');
const Review = require('./Review');
const Favorite = require('./Favorite');
const Contact = require('./Contact');
const RefreshToken = require('./RefreshToken');
const SecurityLog = require('./SecurityLog');
const BannedIP = require('./BannedIP');
const AuditLog = require('./AuditLog');
const Webhook = require('./Webhook');
const ApiUsage = require('./ApiUsage');
const Payment = require('./Payment');
const ProviderStats = require('./ProviderStats');
const Banner = require('./Banner');

// ==================== ASSOCIATIONS ====================

// User <-> Provider (1:1)
User.hasOne(Provider, {
    foreignKey: 'userId',
    as: 'provider',
    onDelete: 'CASCADE'
});
Provider.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Provider <-> Service (1:N)
Provider.hasMany(Service, {
    foreignKey: 'providerId',
    as: 'services',
    onDelete: 'CASCADE'
});
Service.belongsTo(Provider, {
    foreignKey: 'providerId',
    as: 'provider'
});

// Category <-> Service (1:N)
Category.hasMany(Service, {
    foreignKey: 'categoryId',
    as: 'services'
});
Service.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
});

// Provider <-> Review (1:N)
Provider.hasMany(Review, {
    foreignKey: 'providerId',
    as: 'reviews',
    onDelete: 'CASCADE'
});
Review.belongsTo(Provider, {
    foreignKey: 'providerId',
    as: 'provider'
});

// User <-> Review (1:N)
User.hasMany(Review, {
    foreignKey: 'userId',
    as: 'reviews',
    onDelete: 'CASCADE'
});
Review.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> Favorite (1:N)
User.hasMany(Favorite, {
    foreignKey: 'userId',
    as: 'favorites',
    onDelete: 'CASCADE'
});
Favorite.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Provider <-> Favorite (1:N)
Provider.hasMany(Favorite, {
    foreignKey: 'providerId',
    as: 'favorites',
    onDelete: 'CASCADE'
});
Favorite.belongsTo(Provider, {
    foreignKey: 'providerId',
    as: 'provider'
});

// User <-> Contact (1:N - sender)
User.hasMany(Contact, {
    foreignKey: 'userId',
    as: 'sentContacts',
    onDelete: 'SET NULL'
});
Contact.belongsTo(User, {
    foreignKey: 'userId',
    as: 'sender'
});

// Provider <-> Contact (1:N - receiver)
Provider.hasMany(Contact, {
    foreignKey: 'providerId',
    as: 'receivedContacts',
    onDelete: 'CASCADE'
});
Contact.belongsTo(Provider, {
    foreignKey: 'providerId',
    as: 'provider'
});

// User <-> RefreshToken (1:N)
User.hasMany(RefreshToken, {
    foreignKey: 'userId',
    as: 'refreshTokens',
    onDelete: 'CASCADE'
});
RefreshToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> SecurityLog (1:N)
User.hasMany(SecurityLog, {
    foreignKey: 'userId',
    as: 'securityLogs',
    onDelete: 'SET NULL'
});
SecurityLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> AuditLog (1:N)
User.hasMany(AuditLog, {
    foreignKey: 'userId',
    as: 'auditLogs',
    onDelete: 'SET NULL'
});
AuditLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User <-> Webhook (1:N)
User.hasMany(Webhook, {
    foreignKey: 'userId',
    as: 'webhooks',
    onDelete: 'CASCADE'
});
Webhook.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});


// User <-> Payment (1:N)
User.hasMany(Payment, {
    foreignKey: 'userId',
    as: 'payments',
    onDelete: 'SET NULL'
});
Payment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Provider <-> Payment (1:N)
Provider.hasMany(Payment, {
    foreignKey: 'providerId',
    as: 'payments',
    onDelete: 'SET NULL'
});
Payment.belongsTo(Provider, {
    foreignKey: 'providerId',
    as: 'provider'
});

// Subscription model (Provider-only)
const Subscription = require('./Subscription');

// Provider <-> Subscription (1:1)
Provider.hasOne(Subscription, {
    foreignKey: 'providerId',
    as: 'subscription',
    onDelete: 'CASCADE'
});
Subscription.belongsTo(Provider, {
    foreignKey: 'providerId',
    as: 'provider'
});

// ProviderApplication model
const ProviderApplication = require('./ProviderApplication');

// User <-> ProviderApplication (1:1)
User.hasOne(ProviderApplication, {
    foreignKey: 'userId',
    as: 'providerApplication',
    onDelete: 'CASCADE'
});
ProviderApplication.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// PlatformSetting (no associations — pure key/value)
const PlatformSetting = require('./PlatformSetting');

// Referral (referrer User -> referred User)
const Referral = require('./Referral');

User.hasMany(Referral, {
    foreignKey: 'referrerId',
    as: 'referralsMade',
    onDelete: 'CASCADE'
});
User.hasOne(Referral, {
    foreignKey: 'referredUserId',
    as: 'referredBy',
    onDelete: 'CASCADE'
});
Referral.belongsTo(User, {
    foreignKey: 'referrerId',
    as: 'referrer'
});
Referral.belongsTo(User, {
    foreignKey: 'referredUserId',
    as: 'referredUser'
});

// ==================== EXPORTS ====================

module.exports = {
    sequelize,
    User,
    Provider,
    Category,
    Service,
    Review,
    Favorite,
    Contact,
    RefreshToken,
    SecurityLog,
    BannedIP,
    AuditLog,
    Webhook,
    ApiUsage,
    Payment,
    ProviderStats,
    Subscription,
    ProviderApplication,
    Banner,
    PlatformSetting,
    Referral
};




