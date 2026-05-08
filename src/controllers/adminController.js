const { Op, fn, col, literal } = require("sequelize");
const {
  User,
  Provider,
  Service,
  Review,
  Contact,
  Category,
  Payment,
  ProviderApplication,
} = require("../models");
const { asyncHandler, AppError } = require("../middlewares/errorHandler");
const {
  i18nResponse,
  getPaginationParams,
  getPaginationData,
  sendEmailSafely,
  buildSortOrder,
} = require("../utils/helpers");
const {
  accountVerifiedEmail,
  providerFeaturedEmail,
  providerVerificationRevokedEmail,
  providerDeactivatedEmail,
  providerReactivatedEmail,
} = require("../utils/emailTemplates");
const cache = require("../config/redis");
const { auditLogger } = require("../middlewares/audit");
const logger = require("../utils/logger");

/**
 * @desc    Get platform statistics (OPTIMIZED)
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 *
 * Optimization: Reduced from ~19 sequential queries to ~9 parallel queries
 * using Promise.all() and grouped aggregates
 */
const getStats = asyncHandler(async (req, res) => {
  // Run all queries in parallel for better performance
  const [
    // User stats with single grouped query
    userStats,
    // Provider stats with single grouped query
    providerStats,
    // Service count
    totalServices,
    // Review stats (count + avg in one query)
    reviewStats,
    // Contact stats with grouped query
    contactStats,
    // Payment stats with grouped query
    paymentStats,
    // Recent data
    recentUsers,
    recentProviders,
  ] = await Promise.all([
    // 1. User stats - Single query with grouping
    User.findAll({
      attributes: ["role", [fn("COUNT", col("id")), "count"]],
      group: ["role"],
      raw: true,
    }),

    // 2. Provider stats - Single query with conditional counts
    Provider.findOne({
      attributes: [
        [fn("COUNT", col("id")), "total"],
        [
          fn("SUM", literal("CASE WHEN is_verified = true THEN 1 ELSE 0 END")),
          "active",
        ],
        [
          fn("SUM", literal("CASE WHEN is_verified = false THEN 1 ELSE 0 END")),
          "pending",
        ],
        [
          fn("SUM", literal("CASE WHEN is_featured = true THEN 1 ELSE 0 END")),
          "featured",
        ],
      ],
      raw: true,
    }),

    // 3. Services count
    Service.count({ where: { isActive: true } }),

    // 4. Review stats - Combined count and avg
    Review.findOne({
      attributes: [
        [fn("COUNT", col("id")), "total"],
        [fn("AVG", col("rating")), "avgRating"],
      ],
      where: { isVisible: true },
      raw: true,
    }),

    // 5. Contact stats - Single grouped query
    Contact.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      group: ["status"],
      raw: true,
    }),

    // 6. Payment stats - Single grouped query with total amount
    Payment.findAll({
      attributes: [
        "status",
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("amount")), "totalAmount"],
      ],
      group: ["status"],
      raw: true,
    }),

    // 7. Recent users (last 5) - include all user info like registration response
    User.findAll({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "phone",
        "country",
        "gender",
        "isEmailVerified",
        "isActive",
        "lastLogin",
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),

    // 8. Recent providers (with complete information)
    Provider.findAll({
      attributes: [
        "id",
        "userId",
        "businessName",
        "description",
        "location",
        "address",
        "whatsapp",
        "facebook",
        "instagram",
        "photos",
        "activities",
        "latitude",
        "longitude",
        "isVerified",
        "isFeatured",
        "viewsCount",
        "contactsCount",
        "averageRating",
        "totalReviews",
        "documents",
        "verificationStatus",
        "verificationNotes",
        "verifiedAt",
        "verifiedBy",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "phone",
            "country",
            "gender",
            "isEmailVerified",
            "isActive",
            "lastLogin",
            "createdAt",
            "updatedAt",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
  ]);

  // Process user stats
  const userStatsMap = userStats.reduce(
    (acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    },
    { client: 0, provider: 0, admin: 0 }
  );

  const totalUsers = Object.values(userStatsMap).reduce((a, b) => a + b, 0);

  // Process contact stats
  const contactStatsMap = contactStats.reduce(
    (acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    },
    { pending: 0, read: 0, replied: 0 }
  );

  const totalContacts = Object.values(contactStatsMap).reduce(
    (a, b) => a + b,
    0
  );

  // Process payment stats
  const paymentStatsMap = paymentStats.reduce(
    (acc, row) => {
      const normalizedStatus = String(row.status || "").toUpperCase();
      const count = parseInt(row.count || 0, 10);
      const amount = parseInt(row.totalAmount || 0, 10);

      if (normalizedStatus === "ACCEPTED") {
        acc.accepted.count += count;
        acc.accepted.amount += amount;
      } else if (
        normalizedStatus === "PENDING" ||
        normalizedStatus === "WAITING_CUSTOMER"
      ) {
        acc.pending.count += count;
        acc.pending.amount += amount;
      } else if (normalizedStatus === "REFUSED") {
        acc.refused.count += count;
        acc.refused.amount += amount;
      } else if (normalizedStatus === "CANCELLED" || normalizedStatus === "EXPIRED") {
        acc.cancelled.count += count;
        acc.cancelled.amount += amount;
      }

      return acc;
    },
    {
      accepted: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      refused: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    }
  );

  const totalPayments = Object.values(paymentStatsMap).reduce(
    (a, b) => a + b.count,
    0
  );

  i18nResponse(req, res, 200, "admin.stats", {
    users: {
      total: totalUsers,
      clients: userStatsMap.client || 0,
      providers: userStatsMap.provider || 0,
    },
    providers: {
      total: parseInt(providerStats?.total || 0),
      active: parseInt(providerStats?.active || 0),
      pending: parseInt(providerStats?.pending || 0),
      featured: parseInt(providerStats?.featured || 0),
    },
    services: {
      total: totalServices,
    },
    reviews: {
      total: parseInt(reviewStats?.total || 0),
      averageRating: parseFloat(reviewStats?.avgRating || 0).toFixed(2),
    },
    contacts: {
      total: totalContacts,
      pending: contactStatsMap.pending || 0,
    },
    payments: {
      total: totalPayments,
      totalAmount: paymentStatsMap.accepted?.amount || 0,
      accepted: paymentStatsMap.accepted?.count || 0,
      pending: paymentStatsMap.pending?.count || 0,
      refused: paymentStatsMap.refused?.count || 0,
      cancelled: paymentStatsMap.cancelled?.count || 0,
    },
    recentUsers,
    recentProviders,
  });
});

/**
 * @desc    Get pending providers
 * @route   GET /api/admin/providers/pending
 * @access  Private (admin)
 */
const getPendingProviders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const where = { isVerified: false };

  if (search) {
    const searchPattern = `%${search}%`;
    where[Op.or] = [
      { businessName: { [Op.iLike]: searchPattern } },
      { "$user.firstName$": { [Op.iLike]: searchPattern } },
      { "$user.lastName$": { [Op.iLike]: searchPattern } },
      { "$user.email$": { [Op.iLike]: searchPattern } },
    ];
  }

  const { count, rows: providers } = await Provider.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "phone", "profilePhoto"],
      },
    ],
    order: [["createdAt", "ASC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "admin.providersUnderReview", {
    providers,
    pagination,
  });
});

/**
 * @desc    Get all active featured providers
 * @route   GET /api/admin/providers/featured
 * @access  Private (admin)
 */
const getFeaturedProviders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const { count, rows: providers } = await Provider.findAndCountAll({
    where: { isFeatured: true },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "phone", "profilePhoto"],
      },
    ],
    order: [["featuredUntil", "ASC"], ["createdAt", "DESC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "provider.list", {
    providers,
    pagination,
  });
});

/**
 * @desc    Verify/reject a provider
 * @route   PUT /api/admin/providers/:id/verify
 * @access  Private (admin)
 */
const verifyProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isVerified, rejectionReason } = req.body;

  const provider = await Provider.findOne({
    where: {
      [Op.or]: [
        { id: id },
        { userId: id }
      ]
    },
    include: [{ model: User, as: "user" }],
  });

  if (!provider) {
    // Check if it's an application ID to provide better feedback
    const application = await ProviderApplication.findByPk(id);
    if (application) {
      throw new AppError(req.t("provider.applicationIDProvided") || "Cet ID correspond à une candidature. Utilisez l'endpoint /api/admin/provider-applications/:id/review", 404);
    }
    throw new AppError(req.t("provider.notFound"), 404);
  }

  // Require rejection reason when rejecting
  if (!isVerified && !rejectionReason) {
    throw new AppError(req.t("admin.rejectionReasonRequired"), 400);
  }

  const oldValues = { isVerified: provider.isVerified };
  provider.isVerified = isVerified;
  await provider.save({ fields: ["isVerified"] });

  // Audit Log
  auditLogger.providerVerified(req, provider, isVerified);

  // Send email notification (optional - don't fail if email system is down)
  if (isVerified && provider.user) {
    await sendEmailSafely(
      {
        to: provider.user.email,
        ...accountVerifiedEmail({
          firstName: provider.user.firstName,
          businessName: provider.businessName,
        }),
      },
      "Provider verification"
    );
  } else if (!isVerified && provider.user) {
    await sendEmailSafely(
      {
        to: provider.user.email,
        ...providerVerificationRevokedEmail(provider.user.firstName, provider.businessName, rejectionReason),
      },
      "Provider verification revoked"
    );
  }

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(
    req,
    res,
    200,
    isVerified ? "provider.verified" : "provider.rejected",
    { provider }
  );
});

/**
 * @desc    Toggle featured status
 * @route   PUT /api/admin/providers/:id/feature
 * @access  Private (admin)
 */
const featureProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isFeatured, duration } = req.body;

  const provider = await Provider.findOne({
    where: {
      [Op.or]: [
        { id: id },
        { userId: id }
      ]
    },
    include: [{ model: User, as: "user" }],
  });

  if (!provider) {
    // Check if it's an application ID
    const application = await ProviderApplication.findByPk(id);
    if (application) {
      throw new AppError(req.t("provider.applicationIDProvided") || "Cet ID correspond à une candidature. Utilisez l'endpoint /api/admin/provider-applications/:id/review", 404);
    }
    throw new AppError(req.t("provider.notFound"), 404);
  }

  provider.isFeatured = isFeatured;

  if (isFeatured && duration) {
    // Calculate expiration date
    provider.featuredUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
  } else if (!isFeatured) {
    provider.featuredUntil = null; // Clear if not featured
  }

  await provider.save({ fields: ["isFeatured", "featuredUntil"] });

  // Send email notification to provider (optional - don't fail if email system is down)
  if (provider.user && provider.user.email) {
    await sendEmailSafely(
      {
        to: provider.user.email,
        ...providerFeaturedEmail({
          firstName: provider.user.firstName,
          businessName: provider.businessName,
          featured: isFeatured,
        }),
      },
      "Provider featured status"
    );
  }

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(
    req,
    res,
    200,
    isFeatured ? "provider.featured" : "provider.unfeatured",
    { provider }
  );
});

/**
 * @desc    Activate/deactivate user account
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (admin)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError(req.t("user.notFound"), 404);
  }

  // Prevent admin from deactivating themselves
  if (user.id === req.user.id) {
    throw new AppError(req.t("admin.cannotDeactivateSelf"), 400);
  }

  const oldValues = { isActive: user.isActive };
  user.isActive = isActive;
  await user.save({ fields: ["isActive"] });

  // Audit Log
  auditLogger.userStatusChanged(req, user, isActive);

  i18nResponse(
    req,
    res,
    200,
    isActive ? "admin.userActivated" : "admin.userDeactivated",
    {
      user: user.toPublicJSON(),
    }
  );
});

/**
 * @desc    Get all reviews (moderation)
 * @route   GET /api/admin/reviews
 * @access  Private (admin)
 */
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, visible } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const where = {};
  if (visible !== undefined) {
    where.isVisible = visible === "true";
  }

  const { count, rows: reviews } = await Review.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      { model: Provider, as: "provider", attributes: ["id", "businessName"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "review.list", { reviews, pagination });
});

/**
 * @desc    Toggle review visibility
 * @route   PUT /api/admin/reviews/:id/visibility
 * @access  Private (admin)
 */
const updateReviewVisibility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isVisible } = req.body;

  const review = await Review.findByPk(id);
  if (!review) {
    throw new AppError(req.t("review.notFound"), 404);
  }

  review.isVisible = isVisible;
  await review.save({ fields: ["isVisible"] });

  // Recalculate provider rating
  const provider = await Provider.findByPk(review.providerId);
  if (provider) {
    await provider.updateRating(null, false);
  }

  // Audit Log
  auditLogger.reviewModerated(req, review, isVisible);

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(req, res, 200, isVisible ? "review.visible" : "review.hidden", {
    review,
  });
});

/**
 * @desc    Get all users (admin)
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, status } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const where = {};
  // Filter by role if specified, otherwise exclude admins
  where.role = role ? role : { [Op.ne]: 'admin' };

  // Filter by isActive: status=active|inactive (anything else is ignored)
  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { "$provider.businessName$": { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: {
      exclude: ["password", "resetPasswordToken", "resetPasswordExpires"],
    },
    include: [
      {
        model: Provider,
        as: "provider",
        attributes: ["id", "businessName", "isVerified", "isActive"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "common.list", { users, pagination });
});

/**
 * @desc    Get providers with documents under review
 * @route   GET /api/admin/providers/under-review
 * @access  Private (admin)
 */
const getProvidersUnderReview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const where = { verificationStatus: "under_review" };

  if (search) {
    const searchPattern = `%${search}%`;
    where[Op.or] = [
      { businessName: { [Op.iLike]: searchPattern } },
      { "$user.firstName$": { [Op.iLike]: searchPattern } },
      { "$user.lastName$": { [Op.iLike]: searchPattern } },
      { "$user.email$": { [Op.iLike]: searchPattern } },
    ];
  }

  const { count, rows: providers } = await Provider.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "phone", "profilePhoto"],
      },
    ],
    order: [["createdAt", "ASC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "admin.providersUnderReview", {
    providers,
    pagination,
  });
});

/**
 * @desc    Review provider documents (approve/reject)
 * @route   PUT /api/admin/providers/:id/review-documents
 * @access  Private (admin)
 */
const reviewProviderDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, notes, approvedDocuments, rejectedDocuments } = req.body;
  // decision: 'approved' or 'rejected'
  // approvedDocuments: [indexes of approved docs]
  // rejectedDocuments: [indexes of rejected docs with reasons]

  const provider = await Provider.findOne({
    where: {
      [Op.or]: [
        { id: id },
        { userId: id }
      ]
    },
    include: [{ model: User, as: "user" }],
  });

  if (!provider) {
    // Check if it's an application ID
    const application = await ProviderApplication.findByPk(id);
    if (application) {
      throw new AppError(req.t("provider.applicationIDProvided") || "Cet ID correspond à une candidature. Utilisez l'endpoint /api/admin/provider-applications/:id/review", 404);
    }
    throw new AppError(req.t("provider.notFound"), 404);
  }

  if (!["approved", "rejected", "under_review"].includes(decision)) {
    throw new AppError(req.t("common.badRequest"), 400);
  }

  // Update document statuses
  const documents = provider.documents || [];

  if (approvedDocuments && Array.isArray(approvedDocuments)) {
    approvedDocuments.forEach((idx) => {
      // Robustness: Ensure index is valid and document exists
      const documentIndex = parseInt(idx);
      if (!isNaN(documentIndex) && documents[documentIndex]) {
        documents[documentIndex].status = "approved";
      } else {
        logger.warn(`Admin ${req.user.id} tried to approve invalid document index ${idx} for provider ${id}`);
      }
    });
  }

  if (rejectedDocuments && Array.isArray(rejectedDocuments)) {
    rejectedDocuments.forEach((item) => {
      // Robustness: Ensure index is valid and document exists
      const documentIndex = parseInt(item.index);
      if (!isNaN(documentIndex) && documents[documentIndex]) {
        documents[documentIndex].status = "rejected";
        documents[documentIndex].rejectionReason = item.reason;
      } else {
        logger.warn(`Admin ${req.user.id} tried to reject invalid document index ${item.index} for provider ${id}`);
      }
    });
  }

  // Update provider verification status
  if (decision === "approved") {
    provider.verificationStatus = "approved";
    provider.isVerified = true;
    provider.verifiedAt = new Date();
    provider.verifiedBy = req.user.id;

    // Send approval email
    if (provider.user) {
      await sendEmailSafely(
        {
          to: provider.user.email,
          ...accountVerifiedEmail({
            firstName: provider.user.firstName,
            businessName: provider.businessName,
          }),
        },
        "Provider documents approved"
      );
    }
  } else if (decision === "rejected") {
    provider.verificationStatus = "rejected";
    provider.isVerified = false;

    // Send rejection email
    if (provider.user) {
      const { documentsRejectedEmail } = require("../utils/emailTemplates");
      const rejectionReasons = rejectedDocuments
        ? rejectedDocuments.map((d) => d.reason).filter(Boolean)
        : [];

      await sendEmailSafely(
        {
          to: provider.user.email,
          ...documentsRejectedEmail({
            firstName: provider.user.firstName,
            businessName: provider.businessName,
            reasons: rejectionReasons,
            notes: notes,
          }),
        },
        "Provider documents rejected"
      );
    }
  } else {
    // decision === 'under_review'
    provider.verificationStatus = "under_review";
  }

  const oldStatus = provider.verificationStatus;
  const oldDocuments = JSON.parse(JSON.stringify(provider.documents || []));

  provider.documents = documents;
  provider.changed("documents", true);
  provider.verificationNotes = notes || null;
  await provider.save();

  // Audit Log
  auditLogger.documentsReviewed(req, provider, decision, notes);

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(
    req,
    res,
    200,
    decision === "approved" ? "documents.approved" : "documents.rejected",
    {
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        verificationStatus: provider.verificationStatus,
        isVerified: provider.isVerified,
        documents: provider.documents,
        verificationNotes: provider.verificationNotes,
      },
    }
  );
});

/**
 * @desc    Delete a user account (cascade delete associated provider and data)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [{ model: Provider, as: 'provider' }]
  });

  if (!user) {
    throw new AppError(req.t('user.notFound'), 404);
  }

  // Prevent admin from deleting themselves
  if (user.id === req.user.id) {
    throw new AppError(req.t('admin.cannotDeleteSelf'), 400);
  }

  // Prevent deleting other admins
  if (user.role === 'admin') {
    throw new AppError(req.t('admin.cannotDeleteAdmin'), 400);
  }

  const userInfo = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    hadProvider: !!user.provider,
    providerBusinessName: user.provider?.businessName || null
  };

  // Delete user (CASCADE will handle provider, reviews, favorites, tokens, etc.)
  await user.destroy();

  // Audit Log
  auditLogger.adminAction(req, 'USER_DELETED', 'User', id, userInfo, null);

  // Invalidate cache if user had a provider
  if (userInfo.hadProvider) {
    await cache.delByPattern('route:/api/providers*');
  }

  i18nResponse(req, res, 200, 'admin.userDeleted', { deletedUser: userInfo });
});

/**
 * @desc    Activate/deactivate a provider (hide/show from public listings)
 * @route   PUT /api/admin/providers/:id/status
 * @access  Private (admin)
 */
const toggleProviderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, reason } = req.body;

  // Reason is required when deactivating
  if (!isActive && (!reason || reason.trim().length < 5)) {
    throw new AppError(req.t('admin.reasonRequired') || 'La raison de désactivation est requise (min. 5 caractères)', 400);
  }

  const provider = await Provider.findOne({
    where: {
      [Op.or]: [
        { id: id },
        { userId: id }
      ]
    },
    include: [{ model: User, as: "user" }]
  });

  if (!provider) {
    // Check if it's an application ID
    const application = await ProviderApplication.findByPk(id);
    if (application) {
      throw new AppError(req.t("provider.applicationIDProvided") || "Cet ID correspond à une candidature. Utilisez l'endpoint /api/admin/provider-applications/:id/review", 404);
    }
    throw new AppError(req.t("provider.notFound"), 404);
  }

  const oldStatus = provider.isActive;
  provider.isActive = isActive;
  await provider.save({ fields: ['isActive'] });

  // Audit Log
  auditLogger.adminAction(req, 'PROVIDER_STATUS_CHANGED', 'Provider', id,
    { isActive: oldStatus }, { isActive, reason: reason || null });

  // Send email notification
  if (provider.user && provider.user.email) {
    if (!isActive) {
      // Send deactivation email with reason
      await sendEmailSafely({
        to: provider.user.email,
        ...providerDeactivatedEmail({
          firstName: provider.user.firstName,
          businessName: provider.businessName,
          reason: reason.trim()
        })
      }, 'Provider deactivation notification');
    } else {
      // Send reactivation email
      await sendEmailSafely({
        to: provider.user.email,
        ...providerReactivatedEmail({
          firstName: provider.user.firstName,
          businessName: provider.businessName
        })
      }, 'Provider reactivation notification');
    }
  }

  // Invalidate cache
  await cache.delByPattern('route:/api/providers*');

  i18nResponse(req, res, 200,
    isActive ? 'admin.providerActivated' : 'admin.providerDeactivated',
    {
      provider: provider
    }
  );
});

/**
 * @desc    Get all providers for admin (active + inactive, verified + unverified)
 * @route   GET /api/admin/providers
 * @access  Private (admin)
 */
const getAllProvidersAdmin = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    location,
    minRating,
    minPrice,
    maxPrice,
    search,
    sort = "recent",
    isActive,
    isVerified,
  } = req.query;

  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  // Build where clause - no isActive/isVerified forced, admin sees everything
  const where = {};

  // Optional filters for admin
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  if (isVerified !== undefined) {
    where.isVerified = isVerified === 'true';
  }

  if (location) {
    where.location = { [Op.iLike]: `%${location}%` };
  }

  if (minRating) {
    where.averageRating = { [Op.gte]: parseFloat(minRating) };
  }

  if (search) {
    const searchPattern = `%${search}%`;
    where[Op.or] = [
      { businessName: { [Op.iLike]: searchPattern } },
      { description: { [Op.iLike]: searchPattern } },
      {
        id: {
          [Op.in]: literal(
            `(SELECT DISTINCT provider_id FROM services WHERE name ILIKE '${searchPattern}' OR description ILIKE '${searchPattern}')`
          ),
        },
      },
    ];
  }

  // Price Range Filter
  if (minPrice || maxPrice) {
    const minP = parseFloat(minPrice) || 0;
    const maxP = parseFloat(maxPrice) || 999999999;

    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      id: {
        [Op.in]: literal(
          `(SELECT DISTINCT provider_id FROM services WHERE price >= ${minP} AND price <= ${maxP} AND is_active = true)`
        ),
      },
    });
  }

  // Build include for category filter
  const include = [
    {
      model: User,
      as: "user",
      attributes: ["id", "firstName", "lastName", "profilePhoto", "email"],
    },
    {
      model: Service,
      as: 'services',
      attributes: ['id', 'name', 'price'],
      where: { isActive: true },
      required: false,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon'],
        }
      ]
    },
  ];

  // If category filter, add where condition
  if (category) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      id: {
        [Op.in]: literal(
          `(SELECT DISTINCT provider_id FROM services WHERE category_id = (SELECT id FROM categories WHERE slug = '${category}'))`
        ),
      },
    });
  }

  const { count, rows: providersObj } = await Provider.findAndCountAll({
    where,
    include,
    attributes: {
      include: [
        [
          literal(`(SELECT MIN(price) FROM services WHERE services.provider_id = "Provider".id AND services.is_active = true)`),
          'min_price'
        ]
      ]
    },
    order: buildSortOrder(sort),
    limit: queryLimit,
    offset,
    distinct: true,
  });

  // Format the providers to extract unique categories from services
  const providers = providersObj.map(provider => {
    const providerJSON = provider.toJSON();

    // Extract unique categories
    const categoriesMap = new Map();
    if (providerJSON.services) {
      providerJSON.services.forEach(service => {
        if (service.category && !categoriesMap.has(service.category.id)) {
          categoriesMap.set(service.category.id, service.category);
        }
      });
    }

    providerJSON.categories = Array.from(categoriesMap.values());
    delete providerJSON.services;

    return providerJSON;
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "provider.list", { providers, pagination });
});

module.exports = {
  getStats,
  getPendingProviders,
  getFeaturedProviders,
  verifyProvider,
  featureProvider,
  updateUserStatus,
  getAllReviews,
  updateReviewVisibility,
  getAllUsers,
  getProvidersUnderReview,
  reviewProviderDocuments,
  deleteUser,
  toggleProviderStatus,
  getAllProvidersAdmin,
};
