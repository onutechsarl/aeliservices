const { Review, Provider, User, Contact } = require("../models");
const { asyncHandler, AppError } = require("../middlewares/errorHandler");
const {
  i18nResponse,
  successResponse,
  getPaginationParams,
  getPaginationData,
  sendEmailSafely,
} = require("../utils/helpers");
const { newReviewEmail } = require("../utils/emailTemplates");
const cache = require("../config/redis");
const { emitNewReview } = require("../config/socket");

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { providerId, rating, comment } = req.body;

  // Check if provider exists
  const provider = await Provider.findByPk(providerId, {
    include: [{ model: User, as: "user" }],
  });
  if (!provider) {
    throw new AppError(req.t("provider.notFound"), 404);
  }

  // Check if user is not reviewing themselves
  if (provider.userId === req.user.id) {
    throw new AppError(req.t("review.cannotSelfReview"), 400);
  }

  // Anti-abuse: the user must have contacted the provider at least once.
  // We don't require status=read|replied because a provider who never
  // opens their inbox on the platform should not block a legitimate review
  // (the actual exchange typically happens off-platform on WhatsApp).
  const hasContact = await Contact.findOne({
    where: {
      userId: req.user.id,
      providerId,
    },
  });
  if (!hasContact) {
    throw new AppError(req.t("review.mustContactFirst"), 400);
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    where: { userId: req.user.id, providerId },
  });
  if (existingReview) {
    throw new AppError(req.t("review.alreadyReviewed"), 400);
  }

  // Create review
  const review = await Review.create({
    userId: req.user.id,
    providerId,
    rating,
    comment,
  });

  // Update provider rating
  await provider.updateRating(rating, true);

  // Invalidate reviews cache
  await cache.delByPattern(`reviews:provider:${providerId}:*`);
  await cache.del(cache.cacheKeys.provider(providerId));

  // Send WebSocket notification
  emitNewReview(providerId, {
    id: review.id,
    rating,
    comment,
    reviewer: `${req.user.firstName} ${req.user.lastName}`,
  });

  // Send email notification to provider (optional - don't fail if email system is down)
  if (provider.user && provider.user.email) {
    await sendEmailSafely(
      {
        to: provider.user.email,
        ...newReviewEmail({
          providerName: provider.businessName,
          reviewerName: `${req.user.firstName} ${req.user.lastName}`,
          rating,
          comment,
        }),
      },
      "New review notification"
    );
  }

  i18nResponse(req, res, 201, "review.created", { review });
});

/**
 * @desc    Get reviews for a provider
 * @route   GET /api/reviews/provider/:providerId
 * @access  Public
 */
const getProviderReviews = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Try cache first
  const cacheKey = cache.cacheKeys.reviews(providerId, page);
  const cached = await cache.get(cacheKey);
  if (cached) {
    return successResponse(res, 200, req.t("review.list"), cached);
  }

  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: {
      providerId,
      isVisible: true,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "profilePhoto"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  const responseData = { reviews, pagination };

  // Cache for 5 minutes
  await cache.set(cacheKey, responseData, 300);

  i18nResponse(req, res, 200, "review.list", responseData);
});

/**
 * @desc    Update own review
 * @route   PUT /api/reviews/:id
 * @access  Private (owner only)
 */
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findByPk(id);
  if (!review) {
    throw new AppError(req.t("review.notFound"), 404);
  }

  // Check ownership
  if (review.userId !== req.user.id && req.user.role !== "admin") {
    throw new AppError(req.t("common.unauthorized"), 403);
  }

  const oldRating = review.rating;

  if (rating) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  // Recalculate provider rating if rating changed
  if (rating && rating !== oldRating) {
    const provider = await Provider.findByPk(review.providerId);
    if (provider) {
      await provider.updateRating(null, false); // Recalculate from all reviews
    }
  }

  i18nResponse(req, res, 200, "review.updated", { review });
});

/**
 * @desc    Delete own review
 * @route   DELETE /api/reviews/:id
 * @access  Private (owner or admin)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByPk(id);
  if (!review) {
    throw new AppError(req.t("review.notFound"), 404);
  }

  // Check ownership
  if (review.userId !== req.user.id && req.user.role !== "admin") {
    throw new AppError(req.t("common.unauthorized"), 403);
  }

  const providerId = review.providerId;
  await review.destroy();

  // Recalculate provider rating
  const provider = await Provider.findByPk(providerId);
  if (provider) {
    await provider.updateRating(null, false);
  }

  i18nResponse(req, res, 200, "review.deleted");
});

module.exports = {
  createReview,
  getProviderReviews,
  updateReview,
  deleteReview,
};
