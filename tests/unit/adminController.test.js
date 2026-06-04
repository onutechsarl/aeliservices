/**
 * Admin Controller Unit Tests
 * Tests for admin-related endpoints
 */

const {
    getStats,
    getPendingProviders,
    verifyProvider,
    featureProvider,
    updateUserStatus,
    getAllReviews,
    updateReviewVisibility,
    getAllUsers,
    getProvidersUnderReview,
    reviewProviderDocuments,
    getFeaturedProviders,
    deleteUser,
    toggleProviderStatus,
    getAllProvidersAdmin
} = require('../../src/controllers/adminController');

// Mock dependencies
jest.mock('../../src/models', () => ({
    User: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findAndCountAll: jest.fn()
    },
    Provider: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn(),
        findAndCountAll: jest.fn()
    },
    Service: {
        count: jest.fn()
    },
    Review: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAndCountAll: jest.fn()
    },
    Contact: {
        findAll: jest.fn()
    },
    Category: {
        findAll: jest.fn()
    },
    Payment: {
        findAll: jest.fn()
    },
    ProviderApplication: {
        findByPk: jest.fn()
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

jest.mock('../../src/middlewares/audit', () => ({
    auditLogger: {
        providerVerified: jest.fn(),
        userStatusChanged: jest.fn(),
        reviewModerated: jest.fn(),
        documentsReviewed: jest.fn(),
        adminAction: jest.fn()
    }
}));

jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: jest.fn(),
    getPaginationParams: jest.fn(),
    getPaginationData: jest.fn(),
    sendEmailSafely: jest.fn(),
    buildSortOrder: jest.fn().mockReturnValue([['createdAt', 'DESC']])
}));

jest.mock('../../src/config/email', () => ({
    sendEmail: jest.fn()
}));

jest.mock('../../src/utils/emailTemplates', () => ({
    accountVerifiedEmail: jest.fn(),
    providerFeaturedEmail: jest.fn(),
    documentsRejectedEmail: jest.fn(),
    providerVerificationRevokedEmail: jest.fn(),
    providerDeactivatedEmail: jest.fn(),
    providerReactivatedEmail: jest.fn()
}));

jest.mock('../../src/config/redis', () => ({
    delByPattern: jest.fn()
}));

jest.mock('../../src/services/referralReward', () => ({
    rollbackIfApplicable: (...args) => Promise.resolve({ status: 'noop' })
}));

const { User, Provider, Service, Review, Contact, Payment, ProviderApplication } = require('../../src/models');
const { i18nResponse, getPaginationParams, getPaginationData, sendEmailSafely, buildSortOrder } = require('../../src/utils/helpers');
const { sendEmail } = require('../../src/config/email');
const { delByPattern } = require('../../src/config/redis');

describe('Admin Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: 'admin-123', role: 'admin' },
            t: jest.fn((key) => key)
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Setup default mocks
        i18nResponse.mockImplementation(() => { });
        getPaginationParams.mockReturnValue({ limit: 10, offset: 0 });
        getPaginationData.mockReturnValue({ page: 1, totalPages: 1 });
        sendEmailSafely.mockImplementation((emailData) => sendEmail(emailData));
        sendEmail.mockResolvedValue({});
        delByPattern.mockResolvedValue(1);
    });

    describe('getStats', () => {
        it('should get platform statistics successfully', async () => {
            const mockUserStats = [
                { role: 'client', count: '5' },
                { role: 'provider', count: '3' }
            ];
            const mockProviderStats = {
                total: '8',
                active: '6',
                pending: '2',
                featured: '1'
            };
            const mockReviewStats = {
                total: '25',
                avgRating: '4.2'
            };
            const mockContactStats = [
                { status: 'pending', count: '10' },
                { status: 'read', count: '15' }
            ];
            const mockPaymentStats = [
                { status: 'accepted', count: '20', totalAmount: '50000' }
            ];

            User.findAll.mockResolvedValue(mockUserStats);
            Provider.findOne.mockResolvedValue(mockProviderStats);
            Service.count.mockResolvedValue(12);
            Review.findOne.mockResolvedValue(mockReviewStats);
            Contact.findAll.mockResolvedValue(mockContactStats);
            Payment.findAll.mockResolvedValue(mockPaymentStats);
            User.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]); // Recent users and providers

            await getStats(mockReq, mockRes, mockNext);

            expect(User.findAll).toHaveBeenCalledWith({
                attributes: expect.any(Array),
                group: ['role'],
                raw: true
            });
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'admin.stats', expect.any(Object));
        });
    });

    describe('getPendingProviders', () => {
        it('should get pending providers successfully', async () => {
            mockReq.query = { page: 1, limit: 10 };

            const mockProviders = {
                count: 5,
                rows: [{ id: 'provider-1', businessName: 'Provider 1' }]
            };

            Provider.findAndCountAll.mockResolvedValue(mockProviders);

            await getPendingProviders(mockReq, mockRes, mockNext);

            expect(Provider.findAndCountAll).toHaveBeenCalledWith({
                where: { isVerified: false },
                include: expect.any(Array),
                order: [['createdAt', 'ASC']],
                limit: 10,
                offset: 0
            });
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'admin.providersUnderReview', expect.any(Object));
        });
    });

    describe('verifyProvider', () => {
        it('should verify provider successfully', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isVerified: true };

            const mockProvider = {
                id: 'provider-123',
                businessName: 'Test Provider',
                isVerified: false,
                save: jest.fn().mockResolvedValue(),
                user: { email: 'provider@example.com', firstName: 'John' }
            };

            Provider.findOne.mockResolvedValue(mockProvider);

            await verifyProvider(mockReq, mockRes, mockNext);

            expect(mockProvider.isVerified).toBe(true);
            expect(mockProvider.save).toHaveBeenCalledWith({ fields: ['isVerified'] });
            expect(delByPattern).toHaveBeenCalledWith('route:/api/providers*');
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'provider.verified', { provider: mockProvider });
        });

        it('should throw error if provider not found', async () => {
            mockReq.params = { id: 'nonexistent' };

            Provider.findOne.mockResolvedValue(null);

            await expect(verifyProvider(mockReq, mockRes, mockNext)).rejects.toThrow('provider.notFound');
        });

        it('should reject provider with reason and send email', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isVerified: false, rejectionReason: 'Documents non conformes' };

            const mockProvider = {
                id: 'provider-123',
                businessName: 'Test Provider',
                isVerified: true,
                save: jest.fn().mockResolvedValue(),
                user: { email: 'provider@example.com', firstName: 'John' }
            };

            Provider.findOne.mockResolvedValue(mockProvider);

            await verifyProvider(mockReq, mockRes, mockNext);

            expect(mockProvider.isVerified).toBe(false);
            expect(mockProvider.save).toHaveBeenCalledWith({ fields: ['isVerified'] });
            expect(sendEmailSafely).toHaveBeenCalled();
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'provider.rejected', { provider: mockProvider });
        });

        it('should throw error when rejecting without reason', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isVerified: false };

            const mockProvider = {
                id: 'provider-123',
                businessName: 'Test Provider',
                isVerified: true,
                save: jest.fn().mockResolvedValue(),
                user: { email: 'provider@example.com', firstName: 'John' }
            };

            Provider.findOne.mockResolvedValue(mockProvider);

            await expect(verifyProvider(mockReq, mockRes, mockNext)).rejects.toThrow('admin.rejectionReasonRequired');
        });

        it('should throw error if application ID provided instead of provider ID', async () => {
            mockReq.params = { id: 'app-123' };
            Provider.findOne.mockResolvedValue(null);
            ProviderApplication.findByPk.mockResolvedValue({ id: 'app-123' });

            await expect(verifyProvider(mockReq, mockRes, mockNext)).rejects.toThrow('provider.applicationIDProvided');
        });
    });

    describe('getFeaturedProviders', () => {
        it('should get featured providers successfully', async () => {
            mockReq.query = { page: 1, limit: 10 };
            const mockProviders = {
                count: 2,
                rows: [{ id: 'provider-1', isFeatured: true }]
            };
            Provider.findAndCountAll.mockResolvedValue(mockProviders);

            await getFeaturedProviders(mockReq, mockRes, mockNext);

            expect(Provider.findAndCountAll).toHaveBeenCalled();
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'provider.list', expect.any(Object));
        });
    });

    describe('featureProvider', () => {
        it('should feature provider successfully', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isFeatured: true };

            const mockProvider = {
                id: 'provider-123',
                businessName: 'Test Provider',
                isFeatured: false,
                save: jest.fn().mockResolvedValue(),
                user: { email: 'provider@example.com', firstName: 'John' }
            };

            Provider.findOne.mockResolvedValue(mockProvider);

            await featureProvider(mockReq, mockRes, mockNext);

            expect(mockProvider.isFeatured).toBe(true);
            expect(mockProvider.save).toHaveBeenCalledWith({ fields: ['isFeatured', 'featuredUntil'] });
            expect(delByPattern).toHaveBeenCalledWith('route:/api/providers*');
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'provider.featured', { provider: mockProvider });
        });

        it('should feature provider with duration', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isFeatured: true, duration: 30 };
            const mockProvider = {
                id: 'provider-123',
                save: jest.fn().mockResolvedValue(),
                user: { email: 'test@example.com' }
            };
            Provider.findOne.mockResolvedValue(mockProvider);

            await featureProvider(mockReq, mockRes, mockNext);

            expect(mockProvider.featuredUntil).toBeDefined();
            expect(mockProvider.isFeatured).toBe(true);
        });

        it('should throw error if application ID provided to featureProvider', async () => {
            mockReq.params = { id: 'app-123' };
            Provider.findOne.mockResolvedValue(null);
            ProviderApplication.findByPk.mockResolvedValue({ id: 'app-123' });

            await expect(featureProvider(mockReq, mockRes, mockNext)).rejects.toThrow('provider.applicationIDProvided');
        });
    });

    describe('updateUserStatus', () => {
        it('should update user status successfully', async () => {
            mockReq.params = { id: 'user-123' };
            mockReq.body = { isActive: false };

            const mockUser = {
                id: 'user-123',
                firstName: 'John',
                isActive: true,
                save: jest.fn().mockResolvedValue(),
                toPublicJSON: jest.fn().mockReturnValue({ id: 'user-123', firstName: 'John' })
            };

            User.findByPk.mockResolvedValue(mockUser);

            await updateUserStatus(mockReq, mockRes, mockNext);

            expect(mockUser.isActive).toBe(false);
            expect(mockUser.save).toHaveBeenCalledWith({ fields: ['isActive'] });
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'admin.userDeactivated', expect.any(Object));
        });

        it('should throw error if user not found', async () => {
            mockReq.params = { id: 'nonexistent' };

            User.findByPk.mockResolvedValue(null);

            await expect(updateUserStatus(mockReq, mockRes, mockNext)).rejects.toThrow('user.notFound');
        });

        it('should throw error if admin tries to deactivate themselves', async () => {
            mockReq.params = { id: 'admin-123' }; // Same as req.user.id
            mockReq.body = { isActive: false };

            const mockUser = {
                id: 'admin-123',
                isActive: true
            };

            User.findByPk.mockResolvedValue(mockUser);

            await expect(updateUserStatus(mockReq, mockRes, mockNext)).rejects.toThrow('admin.cannotDeactivateSelf');
        });
    });

    describe('getAllReviews', () => {
        it('should get all reviews successfully', async () => {
            mockReq.query = { page: 1, limit: 20, visible: 'true' };

            const mockReviews = {
                count: 25,
                rows: [{ id: 'review-1', rating: 5 }]
            };

            Review.findAndCountAll.mockResolvedValue(mockReviews);

            await getAllReviews(mockReq, mockRes, mockNext);

            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'review.list', expect.any(Object));
        });
    });

    describe('updateReviewVisibility', () => {
        it('should update review visibility successfully', async () => {
            mockReq.params = { id: 'review-123' };
            mockReq.body = { isVisible: false };

            const mockReview = {
                id: 'review-123',
                providerId: 'provider-123',
                isVisible: true,
                save: jest.fn().mockResolvedValue()
            };

            const mockProvider = {
                id: 'provider-123',
                updateRating: jest.fn().mockResolvedValue(),
                changed: jest.fn()
            };

            Review.findByPk.mockResolvedValue(mockReview);
            Provider.findByPk.mockResolvedValue(mockProvider);

            await updateReviewVisibility(mockReq, mockRes, mockNext);

            expect(mockReview.isVisible).toBe(false);
            expect(mockReview.save).toHaveBeenCalledWith({ fields: ['isVisible'] });
            expect(mockProvider.updateRating).toHaveBeenCalledWith(null, false);
            expect(delByPattern).toHaveBeenCalledWith('route:/api/providers*');
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'review.hidden', { review: mockReview });
        });

        it('should throw error if review not found', async () => {
            mockReq.params = { id: 'nonexistent' };

            Review.findByPk.mockResolvedValue(null);

            await expect(updateReviewVisibility(mockReq, mockRes, mockNext)).rejects.toThrow('review.notFound');
        });
    });

    describe('getAllUsers', () => {
        it('should get all users successfully (excluding admins)', async () => {
            mockReq.query = { page: 1, limit: 20, search: 'john' };

            const mockUsers = {
                count: 50,
                rows: [{ id: 'user-1', firstName: 'John' }]
            };

            User.findAndCountAll.mockResolvedValue(mockUsers);

            await getAllUsers(mockReq, mockRes, mockNext);

            expect(User.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        role: { [Symbol.for('ne')]: 'admin' }
                    })
                })
            );
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'common.list', expect.any(Object));
        });

        it('should filter by specific role when provided', async () => {
            mockReq.query = { page: 1, limit: 20, role: 'client' };

            const mockUsers = {
                count: 30,
                rows: [{ id: 'user-1', firstName: 'John', role: 'client' }]
            };

            User.findAndCountAll.mockResolvedValue(mockUsers);

            await getAllUsers(mockReq, mockRes, mockNext);

            expect(User.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        role: 'client'
                    })
                })
            );
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'common.list', expect.any(Object));
        });
    });

    describe('getProvidersUnderReview', () => {
        it('should get providers under review successfully', async () => {
            mockReq.query = { page: 1, limit: 10 };

            const mockProviders = {
                count: 3,
                rows: [{ id: 'provider-1', verificationStatus: 'under_review' }]
            };

            Provider.findAndCountAll.mockResolvedValue(mockProviders);

            await getProvidersUnderReview(mockReq, mockRes, mockNext);

            expect(Provider.findAndCountAll).toHaveBeenCalledWith({
                where: { verificationStatus: 'under_review' },
                include: expect.any(Array),
                order: [['createdAt', 'ASC']],
                limit: 10,
                offset: 0
            });
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'admin.providersUnderReview', expect.any(Object));
        });
    });

    describe('reviewProviderDocuments', () => {
        it('should approve provider documents successfully', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = {
                decision: 'approved',
                approvedDocuments: [0, 1],
                notes: 'All documents approved'
            };

            const mockProvider = {
                id: 'provider-123',
                businessName: 'Test Provider',
                verificationStatus: 'under_review',
                documents: [
                    { type: 'id', status: 'pending' },
                    { type: 'license', status: 'pending' }
                ],
                save: jest.fn().mockResolvedValue(),
                changed: jest.fn(),
                user: { email: 'provider@example.com', firstName: 'John' }
            };

            Provider.findOne.mockResolvedValue(mockProvider);

            await reviewProviderDocuments(mockReq, mockRes, mockNext);

            expect(mockProvider.verificationStatus).toBe('approved');
            expect(mockProvider.isVerified).toBe(true);
            expect(mockProvider.documents[0].status).toBe('approved');
            expect(mockProvider.documents[1].status).toBe('approved');
            expect(mockProvider.save).toHaveBeenCalled();
            expect(delByPattern).toHaveBeenCalledWith('route:/api/providers*');
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'documents.approved', expect.any(Object));
        });

        it('should reject provider documents successfully', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = {
                decision: 'rejected',
                rejectedDocuments: [
                    { index: 0, reason: 'Invalid document' }
                ],
                notes: 'Document rejected'
            };

            const mockProvider = {
                id: 'provider-123',
                businessName: 'Test Provider',
                verificationStatus: 'under_review',
                documents: [
                    { type: 'id', status: 'pending' }
                ],
                save: jest.fn().mockResolvedValue(),
                changed: jest.fn(),
                user: { email: 'provider@example.com', firstName: 'John' }
            };

            Provider.findOne.mockResolvedValue(mockProvider);

            await reviewProviderDocuments(mockReq, mockRes, mockNext);

            expect(mockProvider.verificationStatus).toBe('rejected');
            expect(mockProvider.isVerified).toBe(false);
            expect(mockProvider.documents[0].status).toBe('rejected');
            expect(mockProvider.documents[0].rejectionReason).toBe('Invalid document');
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'documents.rejected', expect.any(Object));
        });

        it('should throw error if provider not found', async () => {
            mockReq.params = { id: 'nonexistent' };

            Provider.findOne.mockResolvedValue(null);

            await expect(reviewProviderDocuments(mockReq, mockRes, mockNext)).rejects.toThrow('provider.notFound');
        });

        it('should throw error if application ID provided to reviewProviderDocuments', async () => {
            mockReq.params = { id: 'app-123' };
            Provider.findOne.mockResolvedValue(null);
            ProviderApplication.findByPk.mockResolvedValue({ id: 'app-123' });

            await expect(reviewProviderDocuments(mockReq, mockRes, mockNext)).rejects.toThrow('provider.applicationIDProvided');
        });

        it('should throw error if invalid decision provided', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { decision: 'maybe' };
            Provider.findOne.mockResolvedValue({ id: 'provider-123' });

            await expect(reviewProviderDocuments(mockReq, mockRes, mockNext)).rejects.toThrow('common.badRequest');
        });

        it('should handle invalid document indexes gracefully', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = {
                decision: 'approved',
                approvedDocuments: [99],
                rejectedDocuments: [{ index: 100, reason: 'Bad' }]
            };
            const mockProvider = {
                id: 'provider-123',
                documents: [{ status: 'pending' }],
                save: jest.fn().mockResolvedValue(),
                changed: jest.fn()
            };
            Provider.findOne.mockResolvedValue(mockProvider);

            await reviewProviderDocuments(mockReq, mockRes, mockNext);

            expect(mockProvider.save).toHaveBeenCalled();
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            mockReq.params = { id: 'user-123' };
            const mockUser = {
                id: 'user-123',
                destroy: jest.fn().mockResolvedValue(),
                provider: { businessName: 'Test' }
            };
            User.findByPk.mockResolvedValue(mockUser);

            await deleteUser(mockReq, mockRes, mockNext);

            expect(mockUser.destroy).toHaveBeenCalled();
            expect(delByPattern).toHaveBeenCalled();
        });

        it('should prevent deleting self', async () => {
            mockReq.params = { id: 'admin-123' }; // Matches mockReq.user.id
            User.findByPk.mockResolvedValue({ id: 'admin-123' });

            await expect(deleteUser(mockReq, mockRes, mockNext)).rejects.toThrow('admin.cannotDeleteSelf');
        });

        it('should prevent deleting other admins', async () => {
            mockReq.params = { id: 'other-admin' };
            User.findByPk.mockResolvedValue({ id: 'other-admin', role: 'admin' });

            await expect(deleteUser(mockReq, mockRes, mockNext)).rejects.toThrow('admin.cannotDeleteAdmin');
        });
    });

    describe('getAllProvidersAdmin', () => {
        it('should get all providers (active + inactive) with no filters', async () => {
            mockReq.query = { page: 1, limit: 12 };

            const mockProviders = {
                count: 3,
                rows: [
                    { toJSON: () => ({ id: 'p1', businessName: 'Active Provider', isActive: true, isVerified: true, services: [] }) },
                    { toJSON: () => ({ id: 'p2', businessName: 'Inactive Provider', isActive: false, isVerified: true, services: [] }) },
                    { toJSON: () => ({ id: 'p3', businessName: 'Unverified Provider', isActive: true, isVerified: false, services: [] }) }
                ]
            };

            Provider.findAndCountAll.mockResolvedValue(mockProviders);

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            // Should NOT force isActive or isVerified in where clause
            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where).not.toHaveProperty('isActive');
            expect(callArgs.where).not.toHaveProperty('isVerified');
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'provider.list', expect.objectContaining({
                providers: expect.any(Array),
                pagination: expect.any(Object)
            }));
        });

        it('should filter by isActive=false when specified', async () => {
            mockReq.query = { page: 1, limit: 12, isActive: 'false' };

            Provider.findAndCountAll.mockResolvedValue({ count: 1, rows: [
                { toJSON: () => ({ id: 'p2', businessName: 'Inactive', isActive: false, services: [] }) }
            ]});

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.isActive).toBe(false);
        });

        it('should filter by isVerified=true when specified', async () => {
            mockReq.query = { page: 1, limit: 12, isVerified: 'true' };

            Provider.findAndCountAll.mockResolvedValue({ count: 1, rows: [
                { toJSON: () => ({ id: 'p1', businessName: 'Verified', isVerified: true, services: [] }) }
            ]});

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.isVerified).toBe(true);
        });

        it('should support search filter', async () => {
            mockReq.query = { page: 1, limit: 12, search: 'salon' };

            Provider.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            const symbols = Object.getOwnPropertySymbols(callArgs.where);
            expect(symbols.some(s => s.toString() === 'Symbol(or)')).toBe(true);
        });

        it('should support location filter', async () => {
            mockReq.query = { page: 1, limit: 12, location: 'Douala' };

            Provider.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.location).toBeDefined();
        });

        it('should extract unique categories from services', async () => {
            mockReq.query = { page: 1, limit: 12 };

            const mockProviders = {
                count: 1,
                rows: [{
                    toJSON: () => ({
                        id: 'p1',
                        businessName: 'Provider',
                        services: [
                            { category: { id: 'cat1', name: 'Coiffure', slug: 'coiffure', icon: '✂️' } },
                            { category: { id: 'cat1', name: 'Coiffure', slug: 'coiffure', icon: '✂️' } },
                            { category: { id: 'cat2', name: 'Maquillage', slug: 'maquillage', icon: '💄' } }
                        ]
                    })
                }]
            };

            Provider.findAndCountAll.mockResolvedValue(mockProviders);

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            const responseData = i18nResponse.mock.calls[0][4];
            expect(responseData.providers[0].categories).toHaveLength(2);
            expect(responseData.providers[0]).not.toHaveProperty('services');
        });

        it('should include user email in results', async () => {
            mockReq.query = { page: 1, limit: 12 };

            Provider.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            const userInclude = callArgs.include.find(i => i.as === 'user');
            expect(userInclude.attributes).toContain('email');
        });

        it('should use pagination correctly', async () => {
            mockReq.query = { page: 2, limit: 5 };
            getPaginationParams.mockReturnValue({ limit: 5, offset: 5 });

            Provider.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await getAllProvidersAdmin(mockReq, mockRes, mockNext);

            expect(getPaginationParams).toHaveBeenCalledWith(2, 5);
            const callArgs = Provider.findAndCountAll.mock.calls[0][0];
            expect(callArgs.limit).toBe(5);
            expect(callArgs.offset).toBe(5);
        });
    });

    describe('toggleProviderStatus', () => {
        it('should activate provider successfully', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isActive: true };
            const mockProvider = {
                id: 'provider-123',
                isActive: false,
                save: jest.fn().mockResolvedValue(),
                user: { email: 'test@example.com' }
            };
            Provider.findOne.mockResolvedValue(mockProvider);

            await toggleProviderStatus(mockReq, mockRes, mockNext);

            expect(mockProvider.isActive).toBe(true);
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'admin.providerActivated', expect.any(Object));
        });

        it('should deactivate provider with reason', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isActive: false, reason: 'Maintenance' };
            const mockProvider = {
                id: 'provider-123',
                isActive: true,
                save: jest.fn().mockResolvedValue(),
                user: { email: 'test@example.com' }
            };
            Provider.findOne.mockResolvedValue(mockProvider);

            await toggleProviderStatus(mockReq, mockRes, mockNext);

            expect(mockProvider.isActive).toBe(false);
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'admin.providerDeactivated', expect.any(Object));
        });

        it('should throw error if deactivating without reason', async () => {
            mockReq.params = { id: 'provider-123' };
            mockReq.body = { isActive: false };
            Provider.findOne.mockResolvedValue({ id: 'provider-123' });

            await expect(toggleProviderStatus(mockReq, mockRes, mockNext)).rejects.toThrow();
        });
    });
});
