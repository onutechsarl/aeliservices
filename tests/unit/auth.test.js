/**
 * Auth Middleware Unit Tests
 * Tests for authentication middleware functions
 */

const { protect, restrictTo, optionalAuth, requireVerifiedEmail, generateToken } = require('../../src/middlewares/auth');

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign: jest.fn()
}));

jest.mock('../../src/models', () => ({
    User: {
        findByPk: jest.fn(),
        update: jest.fn()
    }
}));

const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');

describe('Auth Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            headers: {},
            user: null
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Set environment variables
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_ACCESS_EXPIRES = '15m';
        process.env.SESSION_TIMEOUT_HOURS = '24';
    });

    describe('protect', () => {
        it('should authenticate user successfully', async () => {
            mockReq.headers.authorization = 'Bearer valid-token';

            const mockUser = {
                id: 'user-123',
                isActive: true,
                lastActivity: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            };

            jwt.verify.mockReturnValue({ id: 'user-123' });
            User.findByPk.mockResolvedValue(mockUser);
            User.update.mockResolvedValue([1]);

            await protect(mockReq, mockRes, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(User.findByPk).toHaveBeenCalledWith('user-123', expect.any(Object));
            expect(User.update).toHaveBeenCalled();
            expect(mockReq.user).toBe(mockUser);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should return 401 if no token provided', async () => {
            await protect(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Non autorisé, veuillez vous connecter',
                code: 'NO_TOKEN'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if user not found', async () => {
            mockReq.headers.authorization = 'Bearer valid-token';

            jwt.verify.mockReturnValue({ id: 'user-123' });
            User.findByPk.mockResolvedValue(null);

            await protect(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Utilisateur non trouvé',
                code: 'USER_NOT_FOUND'
            });
        });

        it('should return 401 if user is inactive', async () => {
            mockReq.headers.authorization = 'Bearer valid-token';

            const mockUser = {
                id: 'user-123',
                isActive: false
            };

            jwt.verify.mockReturnValue({ id: 'user-123' });
            User.findByPk.mockResolvedValue(mockUser);

            await protect(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ce compte a été désactivé',
                code: 'ACCOUNT_DISABLED'
            });
        });

        it('should return 401 if session expired', async () => {
            mockReq.headers.authorization = 'Bearer valid-token';

            const mockUser = {
                id: 'user-123',
                isActive: true,
                lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
            };

            jwt.verify.mockReturnValue({ id: 'user-123' });
            User.findByPk.mockResolvedValue(mockUser);

            await protect(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Session expirée. Veuillez vous reconnecter.',
                code: 'SESSION_EXPIRED'
            });
        });

        it('should return 401 for expired token', async () => {
            mockReq.headers.authorization = 'Bearer expired-token';

            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => { throw error; });

            await protect(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token expiré. Utilisez le refresh token.',
                code: 'TOKEN_EXPIRED'
            });
        });

        it('should return 401 for invalid token', async () => {
            mockReq.headers.authorization = 'Bearer invalid-token';

            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            await protect(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token invalide',
                code: 'INVALID_TOKEN'
            });
        });
    });

    describe('restrictTo', () => {
        it('should allow access for allowed role', () => {
            mockReq.user = { role: 'admin' };

            const middleware = restrictTo('admin', 'provider');
            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for forbidden role', () => {
            mockReq.user = { role: 'client' };

            const middleware = restrictTo('admin', 'provider');
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Vous n\'avez pas la permission d\'effectuer cette action',
                code: 'FORBIDDEN'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny access if no user', () => {
            const middleware = restrictTo('admin');
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Vous n\'avez pas la permission d\'effectuer cette action',
                code: 'FORBIDDEN'
            });
        });

        it('should let admin pass a provider-only restriction', () => {
            mockReq.user = { role: 'admin' };

            const middleware = restrictTo('provider');
            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should let admin pass a client-only restriction', () => {
            mockReq.user = { role: 'admin' };

            const middleware = restrictTo('client');
            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('optionalAuth', () => {
        it('should attach user if valid token provided', async () => {
            mockReq.headers.authorization = 'Bearer valid-token';

            const mockUser = {
                id: 'user-123',
                isActive: true
            };

            jwt.verify.mockReturnValue({ id: 'user-123' });
            User.findByPk.mockResolvedValue(mockUser);

            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBe(mockUser);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should continue without user if no token', async () => {
            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBeNull();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should continue without user if invalid token', async () => {
            mockReq.headers.authorization = 'Bearer invalid-token';

            jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });

            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBeNull();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should continue without user if user inactive', async () => {
            mockReq.headers.authorization = 'Bearer valid-token';

            const mockUser = {
                id: 'user-123',
                isActive: false
            };

            jwt.verify.mockReturnValue({ id: 'user-123' });
            User.findByPk.mockResolvedValue(mockUser);

            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBeNull();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('requireVerifiedEmail', () => {
        it('should allow access for verified email', () => {
            mockReq.user = { isEmailVerified: true };

            requireVerifiedEmail(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for unverified email', () => {
            mockReq.user = { isEmailVerified: false };

            requireVerifiedEmail(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Veuillez vérifier votre email pour accéder à cette fonctionnalité.',
                code: 'EMAIL_NOT_VERIFIED'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('generateToken', () => {
        it('should generate JWT token', () => {
            jwt.sign.mockReturnValue('generated-token');

            const token = generateToken('user-123');

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'user-123', type: 'access' },
                'test-secret',
                { expiresIn: '15m' }
            );
            expect(token).toBe('generated-token');
        });
    });
});
