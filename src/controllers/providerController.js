const { Op, fn, col, literal } = require("sequelize");
const {
  sequelize,
  User,
  Provider,
  Service,
  Category,
  Subscription,
  Review,
  Contact,
} = require("../models");
const { asyncHandler, AppError } = require("../middlewares/errorHandler");
const {
  successResponse,
  i18nResponse,
  getPaginationParams,
  getPaginationData,
  buildSortOrder,
  extractPhotoUrls,
  sendEmailSafely,
} = require("../utils/helpers");
const { deleteImage, getPublicIdFromUrl } = require("../config/cloudinary");
const cache = require("../config/redis");
const { t } = require("../middlewares/i18n");
const logger = require("../utils/logger");
const { documentsReceivedEmail } = require("../utils/emailTemplates");

/**
 * @desc    Create provider profile
 * @route   POST /api/providers/create
 * @access  Private (provider role)
 */
const createProvider = asyncHandler(async (req, res) => {
  const {
    businessName,
    description,
    location,
    address,
    whatsapp,
    facebook,
    instagram,
  } = req.body;

  // Check if user already has a provider profile
  const existingProvider = await Provider.findOne({
    where: { userId: req.user.id },
  });
  if (existingProvider) {
    throw new AppError(req.t("provider.alreadyExists"), 400);
  }

  // Extract photo URLs from uploaded files
  const photos = req.files?.photos ? extractPhotoUrls(req.files.photos) : [];
  const profilePhoto = req.files?.profilePhoto?.[0]?.path || null;

  // Create provider
  const provider = await Provider.create({
    userId: req.user.id,
    businessName,
    description,
    location,
    address,
    whatsapp,
    facebook,
    instagram,
    photos,
    profilePhoto,
  });

  // Create FREE 30-day trial subscription
  await Subscription.createTrial(provider.id);

  // Invalidate providers list cache
  await cache.delByPattern("providers:list:*");

  i18nResponse(req, res, 201, "provider.created", {
    provider,
    trial: {
      days: 30,
      message: req.t("subscription.trialStarted"),
    },
  });
});

/**
 * @desc    Get all providers (with filters, pagination)
 * @route   GET /api/providers
 * @access  Public
 */
const getProviders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    categoryId,
    category,
    location,
    minRating,
    minPrice,
    maxPrice,
    search,
    sort = "recent",
  } = req.query;

  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  // Build where clause
  const where = {
    isVerified: true,
    isActive: true,
  };

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
            `(SELECT DISTINCT provider_id FROM services WHERE name ILIKE '${searchPattern}' OR description ILIKE '${searchPattern}')`,
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
          `(SELECT DISTINCT provider_id FROM services WHERE price >= ${minP} AND price <= ${maxP} AND is_active = true)`,
        ),
      },
    });
  }

  // Build include for category filter
  const include = [
    {
      model: User,
      as: "user",
      attributes: ["id", "firstName", "lastName", "profilePhoto"],
    },
    {
      model: Service,
      as: "services",
      attributes: ["id", "name", "price"],
      where: { isActive: true },
      required: false,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug", "icon"],
        },
      ],
    },
  ];

  // If category filter, add where condition
  // Support both categoryId (UUID) and category (slug)
  if (categoryId || category) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      id: {
        [Op.in]: literal(
          categoryId
            ? `(SELECT DISTINCT provider_id FROM services WHERE category_id = '${categoryId}')`
            : `(SELECT DISTINCT provider_id FROM services WHERE category_id = (SELECT id FROM categories WHERE slug = '${category}'))`,
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
          literal(
            `(SELECT MIN(price) FROM services WHERE services.provider_id = "Provider".id AND services.is_active = true)`,
          ),
          "min_price",
        ],
      ],
    },
    order: buildSortOrder(sort),
    limit: queryLimit,
    offset,
    distinct: true,
  });

  // Format the providers to extract unique categories from services
  const providers = providersObj.map((provider) => {
    const providerJSON = provider.toJSON();

    // Extract unique categories
    const categoriesMap = new Map();
    if (providerJSON.services) {
      providerJSON.services.forEach((service) => {
        if (service.category && !categoriesMap.has(service.category.id)) {
          categoriesMap.set(service.category.id, service.category);
        }
      });
    }

    providerJSON.categories = Array.from(categoriesMap.values());
    delete providerJSON.services; // Remove raw services to keep payload small

    return providerJSON;
  });

  const pagination = getPaginationData(page, queryLimit, count);

  const responseData = { providers, pagination };

  i18nResponse(req, res, 200, "provider.list", responseData);
});

const PROVIDER_PUBLIC_ATTRIBUTES = [
  "id",
  "slug",
  "businessName",
  "description",
  "location",
  "address",
  "whatsapp",
  "facebook",
  "instagram",
  "businessContact",
  "photos",
  "profilePhoto",
  "averageRating",
  "totalReviews",
  "viewsCount",
  "contactsCount",
  "isVerified",
  "isFeatured",
  "createdAt",
];

/**
 * Hydrate the public payload for a provider page (services, reviews,
 * subscription-aware visibility, view counter).
 */
const buildProviderPayload = async (provider, req) => {
  const services = await Service.findAll({
    where: { providerId: provider.id, isActive: true },
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "priceType",
      "duration",
      "photo",
    ],
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const reviews = await Review.findAll({
    where: { providerId: provider.id, isVisible: true },
    attributes: ["id", "rating", "comment", "createdAt"],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "profilePhoto"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  const providerData = provider.toJSON();
  providerData.services = services;
  providerData.reviews = reviews;

  const subscriptionStatus = await Subscription.getStatus(provider.id);
  providerData.subscriptionActive = subscriptionStatus.isActive;

  if (!subscriptionStatus.isActive) {
    providerData.whatsapp = null;
    providerData.facebook = null;
    providerData.instagram = null;
    providerData.photos = [];
    if (providerData.user) {
      providerData.user.phone = null;
    }
    providerData.subscriptionExpired = true;
    providerData.subscriptionMessage = req.t(
      "provider.subscriptionExpiredMessage",
    );
  }

  provider.incrementViews().catch((err) => {
    logger.error("View increment error:", {
      error: err.message,
      stack: err.stack,
      providerId: provider.id,
    });
  });

  return providerData;
};

/**
 * @desc    Get single provider details
 * @route   GET /api/providers/:id
 * @access  Public
 */
const getProviderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const provider = await Provider.findByPk(id, {
    attributes: PROVIDER_PUBLIC_ATTRIBUTES,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "profilePhoto", "phone"],
      },
    ],
  });

  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  const providerData = await buildProviderPayload(provider, req);
  i18nResponse(req, res, 200, "provider.details", { provider: providerData });
});

/**
 * @desc    Get a provider's public profile by slug (shareable link)
 * @route   GET /api/providers/by-slug/:slug
 * @access  Public
 */
const getProviderBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const provider = await Provider.findOne({
    where: { slug },
    attributes: PROVIDER_PUBLIC_ATTRIBUTES,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "profilePhoto", "phone"],
      },
    ],
  });

  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  const providerData = await buildProviderPayload(provider, req);
  i18nResponse(req, res, 200, "provider.details", { provider: providerData });
});

/**
 * @desc    Update provider profile
 * @route   PUT /api/providers/:id
 * @access  Private (owner only)
 */
const updateProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    businessName,
    description,
    location,
    address,
    whatsapp,
    facebook,
    instagram,
    businessContact,
  } = req.body;

  const provider = await Provider.findByPk(id);
  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  // Check ownership
  if (provider.userId !== req.user.id && req.user.role !== "admin") {
    throw new AppError(req.t("provider.unauthorized"), 403);
  }

  // Update fields
  if (businessName) provider.businessName = businessName;
  if (description) provider.description = description;
  if (location) provider.location = location;
  if (address !== undefined) provider.address = address;
  if (whatsapp !== undefined) provider.whatsapp = whatsapp;
  if (facebook !== undefined) provider.facebook = facebook;
  if (instagram !== undefined) provider.instagram = instagram;
  if (businessContact !== undefined) provider.businessContact = businessContact;

  // Handle new photos
  if (req.files && req.files.length > 0) {
    const newPhotos = extractPhotoUrls(req.files);
    const currentPhotos = provider.photos || [];

    // Check max photos limit
    if (currentPhotos.length + newPhotos.length > 5) {
      throw new AppError(req.t("documents.maxDocuments", { max: 5 }), 400);
    }

    provider.photos = [...currentPhotos, ...newPhotos];
  }

  // Handle logo upload
  if (req.file) {
    // Delete old logo if exists
    if (provider.profilePhoto) {
      const oldPublicId = getPublicIdFromUrl(provider.profilePhoto);
      if (oldPublicId) {
        await deleteImage(oldPublicId).catch((err) => {
          logger.error("Error deleting old provider logo:", {
            error: err.message,
            publicId: oldPublicId,
          });
        });
      }
    }
    provider.profilePhoto = req.file.path;
  }

  await provider.save();

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(req, res, 200, "provider.updated", { provider });
});

/**
 * @desc    Delete a specific photo from provider gallery
 * @route   DELETE /api/providers/:id/photos/:photoIndex
 * @access  Private (owner only)
 */
const deleteProviderPhoto = asyncHandler(async (req, res) => {
  const { id, photoIndex } = req.params;

  const provider = await Provider.findByPk(id);
  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  // Check ownership
  if (provider.userId !== req.user.id && req.user.role !== "admin") {
    throw new AppError(req.t("common.unauthorized"), 403);
  }

  const photos = provider.photos || [];
  const index = parseInt(photoIndex);

  if (index < 0 || index >= photos.length) {
    throw new AppError(req.t("common.notFound"), 404);
  }

  // Delete from Cloudinary
  const photoUrl = photos[index];
  const publicId = getPublicIdFromUrl(photoUrl);
  if (publicId) {
    await deleteImage(publicId).catch((err) => {
      logger.error("Cloudinary delete error:", {
        error: err.message,
        stack: err.stack,
        publicId,
      });
    });
  }

  // Remove from array
  photos.splice(index, 1);
  provider.photos = photos;
  await provider.save({ fields: ["photos"] });

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(req, res, 200, "provider.photoDeleted", { provider });
});

/**
 * @desc    Get own provider profile
 * @route   GET /api/providers/my-profile
 * @access  Private (provider)
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({
    where: { userId: req.user.id },
    include: [
      {
        model: Service,
        as: "services",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  i18nResponse(req, res, 200, "user.profile", { provider });
});

/**
 * @desc    Get provider dashboard with stats
 * @route   GET /api/providers/my-dashboard
 * @access  Private (provider)
 */
const getMyDashboard = asyncHandler(async (req, res) => {
  logger.debug("getMyDashboard called", {
    userId: req.user?.id,
    role: req.user?.role,
  });

  // Check if user is authenticated and has provider role
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }

  if (req.user.role !== "provider") {
    throw new AppError("Access denied. Provider role required.", 403);
  }

  const provider = await Provider.findOne({
    where: { userId: req.user.id },
  });

  if (!provider) {
    throw new AppError(
      req.t ? req.t("provider.notFound") : "Provider not found",
      404,
    );
  }

  let recentContacts = [];
  let recentReviews = [];
  let pendingContactsCount = 0;

  try {
    // Get recent contacts
    recentContacts = await Contact.findAll({
      where: { providerId: provider.id },
      order: [["createdAt", "DESC"]],
      limit: 5,
    });
    logger.debug("Recent contacts fetched", {
      count: recentContacts.length,
      providerId: provider.id,
    });
  } catch (error) {
    logger.error("Error fetching recent contacts:", {
      error: error.message,
      stack: error.stack,
      providerId: provider.id,
    });
    recentContacts = [];
  }

  try {
    // Get recent reviews
    recentReviews = await Review.findAll({
      where: { providerId: provider.id, isVisible: true },
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "profilePhoto"],
        },
      ],
    });
    logger.debug("Recent reviews fetched", {
      count: recentReviews.length,
      providerId: provider.id,
    });
  } catch (error) {
    logger.error("Error fetching recent reviews:", {
      error: error.message,
      stack: error.stack,
      providerId: provider.id,
    });
    recentReviews = [];
  }

  try {
    // Get pending contacts count
    pendingContactsCount = await Contact.count({
      where: { providerId: provider.id, status: "pending" },
    });
    logger.debug("Pending contacts count", {
      count: pendingContactsCount,
      providerId: provider.id,
    });
  } catch (error) {
    logger.error("Error counting pending contacts:", {
      error: error.message,
      stack: error.stack,
      providerId: provider.id,
    });
    pendingContactsCount = 0;
  }

  const stats = {
    totalViews: provider.viewsCount || 0,
    totalContacts: provider.contactsCount || 0,
    totalReviews: provider.totalReviews || 0,
    averageRating: provider.averageRating
      ? parseFloat(provider.averageRating)
      : 0,
    pendingContacts: pendingContactsCount,
    isVerified: provider.isVerified || false,
    isFeatured: provider.isFeatured || false,
    verificationStatus: provider.verificationStatus || "pending",
  };

  logger.debug("Stats prepared", { providerId: provider.id, stats });

  i18nResponse(req, res, 200, "provider.dashboard", {
    stats,
    recentContacts,
    recentReviews,
  });

  logger.debug("getMyDashboard completed", { providerId: provider.id });
});

/**
 * @desc    Upload verification documents
 * @route   POST /api/providers/:id/documents
 * @access  Private (owner only)
 */
const uploadDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { documentType } = req.body; // cni, business_license, tax_certificate, other

  const provider = await Provider.findByPk(id);
  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  // Check ownership
  if (provider.userId !== req.user.id) {
    throw new AppError(req.t("common.unauthorized"), 403);
  }

  // Check if already verified
  if (provider.isVerified) {
    throw new AppError(req.t("documents.alreadyVerified"), 400);
  }

  // Validate document type
  const validTypes = [
    "cni",
    "business_license",
    "tax_certificate",
    "proof_of_address",
    "other",
  ];
  if (!validTypes.includes(documentType)) {
    throw new AppError(req.t("documents.invalidType"), 400);
  }

  // Check if files uploaded
  if (!req.files || req.files.length === 0) {
    throw new AppError(req.t("documents.noDocuments"), 400);
  }

  // Max 5 documents total
  const currentDocs = provider.documents || [];
  if (currentDocs.length + req.files.length > 5) {
    throw new AppError(req.t("documents.maxDocuments", { max: 5 }), 400);
  }

  // Upload documents
  const { uploadDocument } = require("../config/cloudinary");
  const uploadedDocs = [];

  for (const file of req.files) {
    const result = await uploadDocument(file.path, "aeli-services/documents");
    uploadedDocs.push({
      type: documentType,
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      originalFilename: result.originalFilename || file.originalname,
      uploadedAt: new Date(),
      status: "pending", // pending, approved, rejected
    });
  }

  // Add to existing documents
  provider.documents = [...currentDocs, ...uploadedDocs];
  provider.verificationStatus = "under_review";
  await provider.save();

  // Send confirmation email
  const user = await User.findByPk(provider.userId);

  if (user) {
    await sendEmailSafely(
      {
        to: user.email,
        ...documentsReceivedEmail({
          firstName: user.firstName,
          businessName: provider.businessName,
          documentsCount: uploadedDocs.length,
        }),
      },
      "Documents received",
    );
  }

  // Invalidate cache
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(req, res, 201, "documents.submitted", {
    documents: provider.documents,
    verificationStatus: provider.verificationStatus,
  });
});

/**
 * @desc    Get provider documents (owner or admin)
 * @route   GET /api/providers/:id/documents
 * @access  Private
 */
const getDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const provider = await Provider.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "firstName", "lastName"],
      },
    ],
  });

  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  // Check if owner or admin
  if (provider.userId !== req.user.id && req.user.role !== "admin") {
    throw new AppError(req.t("common.unauthorized"), 403);
  }

  i18nResponse(req, res, 200, "documents.list", {
    provider: {
      id: provider.id,
      businessName: provider.businessName,
      user: provider.user,
    },
    documents: provider.documents || [],
    verificationStatus: provider.verificationStatus,
    verificationNotes: provider.verificationNotes,
    verifiedAt: provider.verifiedAt,
  });
});

/**
 * @desc    Delete a document
 * @route   DELETE /api/providers/:id/documents/:docIndex
 * @access  Private (owner only, before verification)
 */
const deleteDocument = asyncHandler(async (req, res) => {
  const { id, docIndex } = req.params;

  const provider = await Provider.findByPk(id);
  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  if (provider.userId !== req.user.id) {
    throw new AppError(req.t("common.unauthorized"), 403);
  }

  if (provider.isVerified) {
    throw new AppError(req.t("documents.cannotDeleteAfterVerification"), 400);
  }

  const documents = Array.isArray(provider.documents)
    ? [...provider.documents]
    : [];
  const index = parseInt(docIndex);

  if (index < 0 || index >= documents.length) {
    throw new AppError(req.t("common.notFound"), 404);
  }

  // Delete from Cloudinary
  const doc = documents[index];
  if (doc.publicId) {
    await deleteImage(doc.publicId);
  }

  // Remove from array
  documents.splice(index, 1);
  provider.set("documents", documents);
  provider.changed("documents", true);

  // Reset status if no documents left
  if (documents.length === 0) {
    provider.verificationStatus = "pending";
    provider.verificationNotes = null;
    provider.verifiedAt = null;
    provider.verifiedBy = null;
    provider.isVerified = false;
  }

  await provider.save({
    fields: [
      "documents",
      "verificationStatus",
      "verificationNotes",
      "verifiedAt",
      "verifiedBy",
      "isVerified",
    ],
  });
  await cache.delByPattern("route:/api/providers*");

  i18nResponse(req, res, 200, "documents.deleted", {
    documents: provider.documents,
  });
});

module.exports = {
  createProvider,
  getProviders,
  getProviderById,
  getProviderBySlug,
  updateProvider,
  deleteProviderPhoto,
  getMyProfile,
  getMyDashboard,
  uploadDocuments,
  getDocuments,
  deleteDocument,
};
