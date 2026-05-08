/**
 * Review Controller Unit Tests
 * Tests for review-related endpoints
 */

const {
    createReview,
    getProviderReviews,
    updateReview,
    deleteReview
} = require('../../src/controllers/reviewController');

// Mock dependencies
jest.mock('../../src/models', () => ({
    Review: {
        findByPk: jest.fn(),
        findOne: jest.fn(),
        findAndCountAll: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn()
    },
    Provider: {
        findByPk: jest.fn()
    },
    User: {
        findByPk: jest.fn()
    },
    Contact: {
        findOne: jest.fn()
    }
}));

jest.mock('../../src/middlewares/errorHandler', () => ({
    asyncHandler: (fn) => (req, res, next) => fn(req, res, next),
    AppError: class extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: jest.fn(),
    successResponse: jest.fn(),
    getPaginationParams: jest.fn(),
    getPaginationData: jest.fn(),
    sendEmailSafely: jest.fn()
}));

jest.mock('../../src/config/email', () => ({
    sendEmail: jest.fn()
}));

jest.mock('../../src/utils/emailTemplates', () => ({
    newReviewEmail: jest.fn()
}));

jest.mock('../../src/config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
    cacheKeys: {
        reviews: jest.fn(),
        provider: jest.fn()
    }
}));

jest.mock('../../src/config/socket', () => ({
    emitNewReview: jest.fn()
}));

const { Review, Provider, Contact } = require('../../src/models');
const { i18nResponse, successResponse, getPaginationParams, getPaginationData, sendEmailSafely } = require('../../src/utils/helpers');
const cache = require('../../src/config/redis');
const { sendEmail } = require('../../src/config/email');
const { emitNewReview } = require('../../src/config/socket');

describe('Review Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: 'user-123', firstName: 'John', lastName: 'Doe' },
            t: jest.fn((key) => key)
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Setup default mocks
        i18nResponse.mockImplementation(() => { });
        successResponse.mockImplementation(() => { });
        getPaginationParams.mockReturnValue({ limit: 10, offset: 0 });
        getPaginationData.mockReturnValue({ page: 1, totalPages: 1 });
        sendEmailSafely.mockImplementation((emailData) => sendEmail(emailData));
        cache.get.mockResolvedValue(null);
        cache.set.mockResolvedValue('OK');
        cache.del.mockResolvedValue(1);
        cache.delByPattern.mockResolvedValue(5);
        sendEmail.mockResolvedValue({});
        cache.cacheKeys.reviews.mockReturnValue('reviews:provider:123:1');
        cache.cacheKeys.provider.mockReturnValue('provider:123');
    });

    describe('createReview', () => {
        it('should create review successfully', async () => {
            const reviewData = {
                providerId: 'provider-123',
                rating: 5,
                comment: 'Great service!'
            };
            mockReq.body = reviewData;

            const mockProvider = {
                id: 'provider-123',
                userId: 'provider-user-123',
                businessName: 'Test Provider',
                user: { email: 'provider@example.com' },
                updateRating: jest.fn().mockResolvedValue()
            };

            const mockContact = { id: 'contact-123' };
            const mockReview = {
                id: 'review-123',
                ...reviewData
            };

            Provider.findByPk.mockResolvedValue(mockProvider);
            Contact.findOne.mockResolvedValue(mockContact);
            Review.findOne.mockResolvedValue(null);
            Review.create.mockResolvedValue(mockReview);

            await createReview(mockReq, mockRes, mockNext);

            expect(Provider.findByPk).toHaveBeenCalledWith('provider-123', expect.any(Object));
            expect(Contact.findOne).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    providerId: 'provider-123'
                }
            });
            expect(Review.findOne).toHaveBeenCalledWith({
                where: { userId: 'user-123', providerId: 'provider-123' }
            });
            expect(Review.create).toHaveBeenCalledWith({
                userId: 'user-123',
                providerId: 'provider-123',
                rating: 5,
                comment: 'Great service!'
            });
            expect(mockProvider.updateRating).toHaveBeenCalledWith(5, true);
            expect(emitNewReview).toHaveBeenCalled();
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 201, 'review.created', { review: mockReview });
        });

        it('should throw error if provider not found', async () => {
            mockReq.body = { providerId: 'nonexistent' };

            Provider.findByPk.mockResolvedValue(null);

            await expect(createReview(mockReq, mockRes, mockNext)).rejects.toThrow('provider.notFound');
        });

        it('should throw error if user tries to review themselves', async () => {
            mockReq.body = { providerId: 'provider-123' };

            const mockProvider = {
                id: 'provider-123',
                userId: 'user-123' // Same as req.user.id
            };

            Provider.findByPk.mockResolvedValue(mockProvider);

            await expect(createReview(mockReq, mockRes, mockNext)).rejects.toThrow('review.cannotSelfReview');
        });

        it('should throw error if no contact with provider', async () => {
            mockReq.body = { providerId: 'provider-123' };

            const mockProvider = {
                id: 'provider-123',
                userId: 'provider-user-123'
            };

            Provider.findByPk.mockResolvedValue(mockProvider);
            Contact.findOne.mockResolvedValue(null);

            await expect(createReview(mockReq, mockRes, mockNext)).rejects.toThrow('review.mustContactFirst');
        });

        it('should throw error if review already exists', async () => {
            mockReq.body = { providerId: 'provider-123' };

            const mockProvider = {
                id: 'provider-123',
                userId: 'provider-user-123'
            };
            const mockContact = { id: 'contact-123' };
            const mockExistingReview = { id: 'existing-review' };

            Provider.findByPk.mockResolvedValue(mockProvider);
            Contact.findOne.mockResolvedValue(mockContact);
            Review.findOne.mockResolvedValue(mockExistingReview);

            await expect(createReview(mockReq, mockRes, mockNext)).rejects.toThrow('review.alreadyReviewed');
        });
    });

    describe('getProviderReviews', () => {
        it('should return cached reviews if available', async () => {
            mockReq.params = { providerId: 'provider-123' };
            mockReq.query = { page: 1, limit: 10 };

            const cachedData = { reviews: [], pagination: {} };
            cache.get.mockResolvedValue(cachedData);

            await getProviderReviews(mockReq, mockRes, mockNext);

            expect(cache.get).toHaveBeenCalledWith('reviews:provider:123:1');
            expect(successResponse).toHaveBeenCalledWith(mockRes, 200, 'review.list', cachedData);
            expect(i18nResponse).not.toHaveBeenCalled();
        });

        it('should fetch reviews from database if not cached', async () => {
            mockReq.params = { providerId: 'provider-123' };
            mockReq.query = { page: 1, limit: 10 };

            const mockReviews = {
                count: 5,
                rows: [{ id: 'review-1' }, { id: 'review-2' }]
            };

            cache.get.mockResolvedValue(null);
            Review.findAndCountAll.mockResolvedValue(mockReviews);

            await getProviderReviews(mockReq, mockRes, mockNext);

            expect(Review.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    providerId: 'provider-123',
                    isVisible: true
                },
                include: expect.any(Array),
                order: [['createdAt', 'DESC']],
                limit: 10,
                offset: 0
            });
            expect(cache.set).toHaveBeenCalledWith('reviews:provider:123:1', expect.any(Object), 300);
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'review.list', expect.any(Object));
        });
    });

    describe('updateReview', () => {
        it('should update review successfully', async () => {
            mockReq.params = { id: 'review-123' };
            mockReq.body = { rating: 4, comment: 'Updated review' };

            const mockReview = {
                id: 'review-123',
                userId: 'user-123',
                providerId: 'provider-123',
                rating: 5,
                comment: 'Old comment',
                save: jest.fn().mockResolvedValue()
            };

            const mockProvider = {
                id: 'provider-123',
                updateRating: jest.fn().mockResolvedValue()
            };

            Review.findByPk.mockResolvedValue(mockReview);
            Provider.findByPk.mockResolvedValue(mockProvider);

            await updateReview(mockReq, mockRes, mockNext);

            expect(mockReview.rating).toBe(4);
            expect(mockReview.comment).toBe('Updated review');
            expect(mockReview.save).toHaveBeenCalled();
            expect(mockProvider.updateRating).toHaveBeenCalledWith(null, false);
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'review.updated', { review: mockReview });
        });

        it('should throw error if review not found', async () => {
            mockReq.params = { id: 'nonexistent' };

            Review.findByPk.mockResolvedValue(null);

            await expect(updateReview(mockReq, mockRes, mockNext)).rejects.toThrow('review.notFound');
        });

        it('should throw error if not owner', async () => {
            mockReq.params = { id: 'review-123' };

            const mockReview = {
                id: 'review-123',
                userId: 'other-user-123' // Not the same as req.user.id
            };

            Review.findByPk.mockResolvedValue(mockReview);

            await expect(updateReview(mockReq, mockRes, mockNext)).rejects.toThrow('common.unauthorized');
        });
    });

    describe('deleteReview', () => {
        it('should delete review successfully', async () => {
            mockReq.params = { id: 'review-123' };

            const mockReview = {
                id: 'review-123',
                userId: 'user-123',
                providerId: 'provider-123',
                destroy: jest.fn().mockResolvedValue()
            };

            const mockProvider = {
                id: 'provider-123',
                updateRating: jest.fn().mockResolvedValue()
            };

            Review.findByPk.mockResolvedValue(mockReview);
            Provider.findByPk.mockResolvedValue(mockProvider);

            await deleteReview(mockReq, mockRes, mockNext);

            expect(mockReview.destroy).toHaveBeenCalled();
            expect(mockProvider.updateRating).toHaveBeenCalledWith(null, false);
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'review.deleted');
        });

        it('should throw error if review not found', async () => {
            mockReq.params = { id: 'nonexistent' };

            Review.findByPk.mockResolvedValue(null);

            await expect(deleteReview(mockReq, mockRes, mockNext)).rejects.toThrow('review.notFound');
        });

        it('should throw error if not owner', async () => {
            mockReq.params = { id: 'review-123' };

            const mockReview = {
                id: 'review-123',
                userId: 'other-user-123'
            };

            Review.findByPk.mockResolvedValue(mockReview);

            await expect(deleteReview(mockReq, mockRes, mockNext)).rejects.toThrow('common.unauthorized');
        });
    });
});
