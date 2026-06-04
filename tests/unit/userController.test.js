/**
 * User Controller Unit Tests
 * Tests for user-related endpoints
 */

const {
    getProfile,
    updateProfile,
    changePassword,
    deactivateAccount
} = require('../../src/controllers/userController');

// Mock dependencies
jest.mock('../../src/models', () => ({
    User: {
        findByPk: jest.fn()
    },
    Provider: {
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

jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: jest.fn(),
    sendEmailSafely: jest.fn()
}));

jest.mock('../../src/config/cloudinary', () => ({
    deleteImage: jest.fn(),
    getPublicIdFromUrl: jest.fn()
}));

jest.mock('../../src/config/email', () => ({
    sendEmail: jest.fn()
}));

jest.mock('../../src/utils/emailTemplates', () => ({
    passwordChangedConfirmationEmail: jest.fn()
}));

jest.mock('../../src/services/referralReward', () => ({
    rollbackIfApplicable: (...args) => Promise.resolve({ status: 'noop' })
}));

const { User } = require('../../src/models');
const { i18nResponse, sendEmailSafely } = require('../../src/utils/helpers');
const { deleteImage, getPublicIdFromUrl } = require('../../src/config/cloudinary');
const { sendEmail } = require('../../src/config/email');

describe('User Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            body: {},
            params: {},
            user: { id: 'user-123' },
            file: {
                path: 'uploads/profile-photo.jpg'
            },
            t: jest.fn((key) => key)
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Setup default mocks
        i18nResponse.mockImplementation(() => {});
        sendEmailSafely.mockImplementation((emailData) => sendEmail(emailData));
        deleteImage.mockResolvedValue('OK');
        getPublicIdFromUrl.mockReturnValue('old-public-id');
        sendEmail.mockResolvedValue({});
    });

    describe('getProfile', () => {
        it('should get user profile successfully', async () => {
            const mockUser = {
                id: 'user-123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                toPublicJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com'
                }),
                provider: {
                    id: 'provider-123',
                    businessName: 'Test Provider'
                }
            };

            User.findByPk.mockResolvedValue(mockUser);

            await getProfile(mockReq, mockRes, mockNext);

            expect(User.findByPk).toHaveBeenCalledWith('user-123', expect.any(Object));
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'user.profile', {
                user: mockUser.toPublicJSON(),
                provider: mockUser.provider
            });
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(getProfile(mockReq, mockRes, mockNext)).rejects.toThrow('user.notFound');
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            mockReq.body = {
                firstName: 'Jane',
                lastName: 'Smith',
                phone: '+1234567890'
            };

            const mockUser = {
                id: 'user-123',
                firstName: 'John',
                lastName: 'Doe',
                phone: null,
                profilePhoto: 'old-photo.jpg',
                save: jest.fn().mockResolvedValue(),
                toPublicJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    phone: '+1234567890'
                })
            };

            User.findByPk.mockResolvedValue(mockUser);

            await updateProfile(mockReq, mockRes, mockNext);

            expect(mockUser.firstName).toBe('Jane');
            expect(mockUser.lastName).toBe('Smith');
            expect(mockUser.phone).toBe('+1234567890');
            expect(mockUser.save).toHaveBeenCalled();
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'user.profileUpdated', {
                user: mockUser.toPublicJSON()
            });
        });

        it('should update profile with new photo', async () => {
            mockReq.body = { firstName: 'Jane' };

            const mockUser = {
                id: 'user-123',
                firstName: 'John',
                profilePhoto: 'old-photo.jpg',
                save: jest.fn().mockResolvedValue(),
                toPublicJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    firstName: 'Jane'
                })
            };

            User.findByPk.mockResolvedValue(mockUser);
            getPublicIdFromUrl.mockReturnValue('old-public-id');

            await updateProfile(mockReq, mockRes, mockNext);

            expect(deleteImage).toHaveBeenCalledWith('old-public-id');
            expect(mockUser.profilePhoto).toBe('uploads/profile-photo.jpg');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should update profile without photo upload', async () => {
            mockReq.body = { firstName: 'Jane' };
            mockReq.file = undefined;

            const mockUser = {
                id: 'user-123',
                firstName: 'John',
                save: jest.fn().mockResolvedValue(),
                toPublicJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    firstName: 'Jane'
                })
            };

            User.findByPk.mockResolvedValue(mockUser);

            await updateProfile(mockReq, mockRes, mockNext);

            expect(deleteImage).not.toHaveBeenCalled();
            expect(mockUser.profilePhoto).toBeUndefined();
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(updateProfile(mockReq, mockRes, mockNext)).rejects.toThrow('user.notFound');
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            mockReq.body = {
                currentPassword: 'oldpass123',
                newPassword: 'newpass123'
            };

            const mockUser = {
                id: 'user-123',
                firstName: 'John',
                email: 'john@example.com',
                password: 'hashedoldpass',
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue()
            };

            User.findByPk.mockResolvedValue(mockUser);

            await changePassword(mockReq, mockRes, mockNext);

            expect(mockUser.comparePassword).toHaveBeenCalledWith('oldpass123');
            expect(mockUser.password).toBe('newpass123');
            expect(mockUser.save).toHaveBeenCalled();
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'user.passwordChanged');
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(changePassword(mockReq, mockRes, mockNext)).rejects.toThrow('user.notFound');
        });

        it('should throw error if current password is incorrect', async () => {
            mockReq.body = {
                currentPassword: 'wrongpass',
                newPassword: 'newpass123'
            };

            const mockUser = {
                id: 'user-123',
                comparePassword: jest.fn().mockResolvedValue(false)
            };

            User.findByPk.mockResolvedValue(mockUser);

            await expect(changePassword(mockReq, mockRes, mockNext)).rejects.toThrow('user.incorrectPassword');
        });
    });

    describe('deactivateAccount', () => {
        it('should deactivate account successfully', async () => {
            const mockUser = {
                id: 'user-123',
                isActive: true,
                save: jest.fn().mockResolvedValue()
            };

            User.findByPk.mockResolvedValue(mockUser);

            await deactivateAccount(mockReq, mockRes, mockNext);

            expect(mockUser.isActive).toBe(false);
            expect(mockUser.save).toHaveBeenCalledWith({ fields: ['isActive'] });
            expect(i18nResponse).toHaveBeenCalledWith(mockReq, mockRes, 200, 'user.accountDeactivated');
        });

        it('should throw error if user not found', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(deactivateAccount(mockReq, mockRes, mockNext)).rejects.toThrow('user.notFound');
        });
    });
});
