const { initializePayment, handleWebhook } = require('../../src/controllers/paymentController');
const Payment = require('../../src/models/Payment');
const { User, Provider } = require('../../src/models');
const axios = require('axios');
const { AppError } = require('../../src/middlewares/errorHandler');
const { CINETPAY_CONFIG } = require('../../src/config/cinetpay');

// Mock helpers
jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: jest.fn().mockImplementation(() => { }),
    getPaginationParams: jest.fn(() => ({ limit: 10, offset: 0 })),
    getPaginationData: jest.fn().mockImplementation(() => ({})),
    getFrontendUrl: jest.fn(() => 'http://localhost:5173'),
}));

// Mock paymentGateway
jest.mock('../../src/utils/paymentGateway', () => ({
    initializeCinetPayPayment: jest.fn().mockResolvedValue({
        code: '201',
        data: { payment_url: 'http://test.com', payment_token: 'token' }
    }),
    initializeNotchPayPayment: jest.fn().mockResolvedValue({
        status: 'Accepted',
        authorization_url: 'http://pay.notch.me'
    })
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

// Mock audit middleware
jest.mock('../../src/middlewares/audit', () => ({
    auditLogger: {
        paymentCompleted: jest.fn(),
        userLoggedIn: jest.fn(),
        providerCreated: jest.fn(),
        reviewModerated: jest.fn()
    }
}));

// Mock axios
jest.mock('axios');

// Mock Models
jest.mock('../../src/models/Payment');
jest.mock('../../src/models', () => {
    const mockModels = {
        User: { findByPk: jest.fn() },
        Provider: { update: jest.fn(), increment: jest.fn() },
        sequelize: {
            fn: jest.fn(),
            col: jest.fn(),
            sync: jest.fn().mockResolvedValue(true),
            authenticate: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue(true)
        }
    };
    return mockModels;
});

// Mock errorHandler and asyncHandler
jest.mock('../../src/middlewares/errorHandler', () => {
    return {
        asyncHandler: (fn) => (req, res, next) => fn(req, res, next), // Pass through
        AppError: class extends Error {
            constructor(message, statusCode) {
                super(message);
                this.statusCode = statusCode;
            }
        }
    };
});

// Mock email
jest.mock('../../src/config/email', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('PaymentController Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 'user-123' },
            t: jest.fn((key) => key),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        next = jest.fn();

        // Ensure siteId is set for tests
        CINETPAY_CONFIG.siteId = '789456';
        CINETPAY_CONFIG.apiKey = 'api-key-test';

        // Mock paymentGateway functions
        const mockPaymentGateway = {
            initializeCinetPayPayment: jest.fn().mockResolvedValue({
                code: '201',
                data: { payment_url: 'http://test.com', payment_token: 'token' }
            }),
            initializeNotchPayPayment: jest.fn().mockResolvedValue({
                status: 'Accepted',
                authorization_url: 'http://pay.notch.me'
            })
        };

        jest.mock('../../src/utils/paymentGateway', () => mockPaymentGateway);

        jest.clearAllMocks();
    });

    describe('initializePayment', () => {
        it('should initialize payment for subscription', async () => {
            req.body = {
                amount: 5000,
                type: 'subscription',
                description: 'Monthly sub'
            };

            const mockUser = { id: 'user-123', email: 'test@aeli.com', lastName: 'Doe' };
            User.findByPk.mockResolvedValue(mockUser);

            Payment.generateTransactionId.mockReturnValue('AELI_TX_123');
            const mockPayment = {
                id: 'pay-uuid',
                transactionId: 'AELI_TX_123',
                save: jest.fn().mockResolvedValue(true)
            };
            Payment.create.mockResolvedValue(mockPayment);

            axios.post.mockResolvedValue({
                data: {
                    code: '201',
                    data: { payment_token: 'tok-123', payment_url: 'http://pay.me' }
                }
            });

            await initializePayment(req, res, next);

            expect(Payment.create).toHaveBeenCalled();
            expect(mockPayment.paymentToken).toBe('tok-123');
            expect(mockPayment.save).toHaveBeenCalled();
        });

        it('should throw error for invalid amount', async () => {
            req.body = { amount: 50, type: 'subscription' };
            await expect(initializePayment(req, res, next)).rejects.toThrow('common.badRequest');
        });
    });

    describe('initializeNotchPayPayment', () => {
        it('should initialize NotchPay payment', async () => {
            const { initializeNotchPayPayment } = require('../../src/controllers/paymentController');

            req.body = {
                amount: 5000,
                type: 'subscription',
                description: 'Monthly sub'
            };

            const mockUser = { id: 'user-123', email: 'test@aeli.com', lastName: 'Doe', firstName: 'John' };
            User.findByPk.mockResolvedValue(mockUser);

            const mockPayment = {
                id: 'pay-uuid',
                transactionId: 'AELI_TX_123',
                save: jest.fn().mockResolvedValue(true)
            };
            Payment.create.mockResolvedValue(mockPayment);
            Payment.generateTransactionId.mockReturnValue('AELI_TX_123');

            await initializeNotchPayPayment(req, res, next);

            expect(Payment.create).toHaveBeenCalled();
            // paymentUrl is set directly on payment object before save
        });
    });

    describe('checkPaymentStatus', () => {
        const { checkPaymentStatus } = require('../../src/controllers/paymentController');

        it('should return payment status', async () => {
            req.params = { transactionId: 'AELI_TX_123' };

            const mockPayment = {
                transactionId: 'AELI_TX_123',
                userId: 'user-123',
                status: 'ACCEPTED',
                amount: 5000,
                currency: 'XAF',
                type: 'boost',
                paymentMethod: 'OM'
            };
            Payment.findByTransactionId.mockResolvedValue(mockPayment);

            await checkPaymentStatus(req, res, next);

            const { i18nResponse } = require('../../src/utils/helpers');
            expect(i18nResponse).toHaveBeenCalledWith(req, res, 200, 'payment.status', expect.anything());
        });

        it('should forbid reading a payment owned by another user', async () => {
            req.params = { transactionId: 'AELI_TX_999' };
            Payment.findByTransactionId.mockResolvedValue({
                transactionId: 'AELI_TX_999',
                userId: 'someone-else',
                status: 'ACCEPTED',
            });

            await checkPaymentStatus(req, res, next);

            // asyncHandler forwards the AppError to next()
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 403 }),
            );
        });
    });

    describe('getPaymentHistory', () => {
        const { getPaymentHistory } = require('../../src/controllers/paymentController');

        it('should return client payment history', async () => {
            // Mock getPaginationParams for this specific test
            const { getPaginationParams } = require('../../src/utils/helpers');
            getPaginationParams.mockReturnValueOnce({ limit: 10, offset: 0 });

            Payment.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: [{ id: 'pay-1', amount: 1000 }]
            });

            await getPaymentHistory(req, res, next);

            const { i18nResponse } = require('../../src/utils/helpers');
            expect(i18nResponse).toHaveBeenCalled();
        });
    });

    describe('getAllPayments', () => {
        const { getAllPayments } = require('../../src/controllers/paymentController');

        it('should return all payments for admin', async () => {
            // Mock getPaginationParams for this specific test
            const { getPaginationParams } = require('../../src/utils/helpers');
            getPaginationParams.mockReturnValueOnce({ limit: 20, offset: 0 });

            Payment.findAndCountAll.mockResolvedValue({
                count: 5,
                rows: [{ id: 'pay-1', amount: 1000 }]
            });
            Payment.findAll.mockResolvedValue([{ totalAmount: 5000, totalCount: 5 }]);

            await getAllPayments(req, res, next);

            const { i18nResponse } = require('../../src/utils/helpers');
            expect(i18nResponse).toHaveBeenCalled();
        });
    });

    describe('handleNotchPayWebhook', () => {
        const crypto = require('crypto');
        const { handleNotchPayWebhook } = require('../../src/controllers/paymentController');
        const { NOTCH_PAY_CONFIG } = require('../../src/config/notchpay');

        const WEBHOOK_SECRET = 'test_webhook_secret';
        let previousSecret;

        beforeEach(() => {
            previousSecret = NOTCH_PAY_CONFIG.webhookSecret;
            NOTCH_PAY_CONFIG.webhookSecret = WEBHOOK_SECRET;
        });

        afterEach(() => {
            NOTCH_PAY_CONFIG.webhookSecret = previousSecret;
        });

        const sign = (rawBody) =>
            crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

        it('should process an accepted NotchPay webhook when the signature is valid', async () => {
            req.method = 'POST';
            req.body = {
                event: 'payment.completed',
                data: {
                    reference: 'trx.test_123',
                    merchant_reference: 'AELI_TX_123',
                    status: 'complete'
                }
            };
            req.rawBody = Buffer.from(JSON.stringify(req.body));
            req.headers = { 'x-notch-signature': sign(req.rawBody) };

            const mockPayment = {
                transactionId: 'AELI_TX_123',
                type: 'contact_premium',
                status: 'PENDING',
                updateFromNotchPay: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true)
            };
            Payment.findByTransactionId.mockResolvedValue(mockPayment);

            await handleNotchPayWebhook(req, res, next);

            expect(Payment.findByTransactionId).toHaveBeenCalledWith('AELI_TX_123');
            expect(mockPayment.updateFromNotchPay).toHaveBeenCalledWith({
                reference: 'trx.test_123',
                merchant_reference: 'AELI_TX_123',
                status: 'complete'
            });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should reject a webhook with no signature header', async () => {
            req.method = 'POST';
            req.body = { event: 'payment.completed', data: { merchant_reference: 'AELI_TX_123', status: 'complete' } };
            req.rawBody = Buffer.from(JSON.stringify(req.body));
            req.headers = {};

            await handleNotchPayWebhook(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(Payment.findByTransactionId).not.toHaveBeenCalled();
        });

        it('should reject a webhook with a forged signature', async () => {
            req.method = 'POST';
            req.body = { event: 'payment.completed', data: { merchant_reference: 'AELI_TX_123', status: 'complete' } };
            req.rawBody = Buffer.from(JSON.stringify(req.body));
            req.headers = { 'x-notch-signature': 'deadbeef' };

            await handleNotchPayWebhook(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(Payment.findByTransactionId).not.toHaveBeenCalled();
        });
    });

    describe('handleWebhook', () => {
        it('should accept payment and trigger business logic', async () => {
            req.body = {
                cpm_trans_id: 'AELI_TX_123',
                cpm_site_id: '789456',
                cpm_amount: 5000
            };

            const mockPayment = {
                transactionId: 'AELI_TX_123',
                status: 'PENDING',
                type: 'boost',
                providerId: 'prov-1',
                updateFromCinetPay: jest.fn().mockResolvedValue(true),
                save: jest.fn()
            };
            Payment.findByTransactionId.mockResolvedValue(mockPayment);

            axios.post.mockResolvedValue({
                data: {
                    code: '00',
                    data: { status: 'ACCEPTED', payment_date: '2023-01-01' }
                }
            });

            await handleWebhook(req, res, next);

            expect(mockPayment.updateFromCinetPay).toHaveBeenCalled();
            expect(Provider.increment).toHaveBeenCalledWith('viewsCount', expect.anything());
            expect(res.send).toHaveBeenCalledWith('OK');
        });

        it('should handle refused payment from CinetPay', async () => {
            req.body = {
                cpm_trans_id: 'AELI_TX_123',
                cpm_site_id: '789456'
            };

            const mockPayment = {
                transactionId: 'AELI_TX_123',
                status: 'PENDING',
                save: jest.fn()
            };
            Payment.findByTransactionId.mockResolvedValue(mockPayment);

            axios.post.mockResolvedValue({
                data: {
                    code: '600',
                    data: { status: 'REFUSED' },
                    message: 'Refusé'
                }
            });

            await handleWebhook(req, res, next);

            expect(mockPayment.status).toBe('REFUSED');
            expect(mockPayment.save).toHaveBeenCalled();
        });
    });
});
