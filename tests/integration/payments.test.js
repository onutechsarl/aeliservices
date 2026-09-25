const request = require('supertest');
const { User, Provider, Payment, Category } = require('../../src/models');
const { generateToken } = require('../../src/middlewares/auth');
const nock = require('nock');
const { CINETPAY_CONFIG } = require('../../src/config/cinetpay');

// Définir la clé secrète NotchPay pour les tests de signature
process.env.NOTCH_PAY_SECRET_KEY = 'test_secret_key_for_signature_verification';

const app = require('../../src/app');
const { NOTCH_PAY_CONFIG } = require('../../src/config/notchpay');

describe('Payment API Integration', () => {
    let adminToken;
    let clientToken;
    let clientUser;
    let testProvider;
    let testCategory;

    beforeAll(async () => {
        // Clear nock before starting
        nock.cleanAll();

        // Setup admin
        const adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'Payment',
            email: `admin_pay_${Date.now()}@test.com`,
            password: 'Password123!',
            role: 'admin',
            isEmailVerified: true
        });
        adminToken = generateToken(adminUser.id);

        // Setup client
        clientUser = await User.create({
            firstName: 'Client',
            lastName: 'Payment',
            email: `client_pay_${Date.now()}@test.com`,
            password: 'Password123!',
            role: 'client',
            isEmailVerified: true
        });
        clientToken = generateToken(clientUser.id);

        // Setup Category and Provider for related payments
        testCategory = await Category.create({
            name: 'Test Category',
            slug: 'test-category',
            description: 'Test Description'
        });

        const providerUser = await User.create({
            firstName: 'Provider',
            lastName: 'User',
            email: `provider_pay_${Date.now()}@test.com`,
            password: 'Password123!',
            role: 'provider'
        });

        testProvider = await Provider.create({
            userId: providerUser.id,
            businessName: 'Payment Test Biz',
            description: 'This is a long description for the payment test provider to satisfy validation rules.',
            location: 'Douala',
            categoryId: testCategory.id
        });
    });

    afterAll(async () => {
        nock.cleanAll();
        try {
            // Use truncate to avoid foreign key constraint issues
            await Payment.sequelize.query('TRUNCATE TABLE payments RESTART IDENTITY CASCADE;');
            await Provider.sequelize.query('TRUNCATE TABLE providers RESTART IDENTITY CASCADE;');
            await Category.sequelize.query('TRUNCATE TABLE categories RESTART IDENTITY CASCADE;');
            await User.sequelize.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
        } catch (error) {
            console.error('Error during test cleanup:', error.message);
            // Fallback to individual deletes if truncate fails
            await Payment.destroy({ where: {}, force: true });
            await Provider.destroy({ where: {}, force: true });
            await Category.destroy({ where: {}, force: true });
            await User.destroy({ where: {}, force: true });
        }
    });

    describe('POST /api/payments/initialize (CinetPay)', () => {
        it('should initialize a CinetPay payment', async () => {
            // Mock CinetPay API
            nock('https://api-checkout.cinetpay.com')
                .post('/v2/payment')
                .reply(200, {
                    code: '201',
                    message: 'CREATED',
                    data: {
                        payment_token: 'test_token_123',
                        payment_url: 'https://checkout.cinetpay.com/pay/test_token_123'
                    }
                });

            const res = await request(app)
                .post('/api/payments/initialize')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    amount: 1000,
                    type: 'contact_premium',
                    description: 'Test Payment'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.paymentUrl).toBe('https://checkout.cinetpay.com/pay/test_token_123');

            // Verify payment record in DB
            const payment = await Payment.findOne({ where: { transactionId: res.body.data.transactionId } });
            expect(payment).toBeDefined();
            expect(payment.amount).toBe(1000);
            expect(payment.status).toBe('PENDING');
        });

        it('should fail if amount is not a multiple of 5', async () => {
            const res = await request(app)
                .post('/api/payments/initialize')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    amount: 999,
                    type: 'contact_premium'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/payments/webhook (CinetPay)', () => {
        it('should process a successful CinetPay webhook', async () => {
            const transactionId = Payment.generateTransactionId();
            const payment = await Payment.create({
                transactionId,
                userId: clientUser.id,
                amount: 1000,
                type: 'boost',
                providerId: testProvider.id,
                status: 'PENDING'
            });

            // Mock CinetPay Verification API
            nock('https://api-checkout.cinetpay.com')
                .post('/v2/payment/check')
                .reply(200, {
                    code: '00',
                    message: 'SUCCES',
                    data: {
                        status: 'ACCEPTED',
                        amount: '1000',
                        currency: 'XAF',
                        payment_date: new Date().toISOString(),
                        payment_method: 'OM'
                    }
                });

            const res = await request(app)
                .post('/api/payments/webhook')
                .send({
                    cpm_trans_id: transactionId,
                    cpm_site_id: CINETPAY_CONFIG.siteId,
                    cpm_amount: 1000
                });

            expect(res.statusCode).toBe(200);
            expect(res.text).toBe('OK');

            // Verify payment status updated
            const updatedPayment = await Payment.findByPk(payment.id);
            expect(updatedPayment.status).toBe('ACCEPTED');
        });
    });

    describe('POST /api/payments/notchpay/initialize', () => {
        it('should initialize a NotchPay payment', async () => {
            // Mock NotchPay API
            nock('https://api.notchpay.co')
                .post('/payments/initialize')
                .reply(200, {
                    status: 'Accepted',
                    authorization_url: 'https://pay.notchpay.co/checkout/test_ref'
                });

            const res = await request(app)
                .post('/api/payments/notchpay/initialize')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    amount: 5000,
                    type: 'subscription',
                    providerId: testProvider.id
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.paymentUrl).toBe('https://pay.notchpay.co/checkout/test_ref');
        });
    });

    describe('POST /api/payments/notchpay/webhook', () => {
        const crypto = require('crypto');
        const { NOTCH_PAY_CONFIG } = require('../../src/config/notchpay');
        const WEBHOOK_SECRET = 'test_webhook_secret';
        let previousSecret;

        // The signature is computed over the exact bytes sent on the wire.
        // supertest serializes with JSON.stringify, so we sign the same string.
        const signedRequest = (payload) => {
            const raw = JSON.stringify(payload);
            const signature = crypto
                .createHmac('sha256', WEBHOOK_SECRET)
                .update(raw)
                .digest('hex');
            return request(app)
                .post('/api/payments/notchpay/webhook')
                .set('Content-Type', 'application/json')
                .set('x-notch-signature', signature)
                .send(raw);
        };

        beforeAll(() => {
            previousSecret = NOTCH_PAY_CONFIG.webhookSecret;
            NOTCH_PAY_CONFIG.webhookSecret = WEBHOOK_SECRET;
        });

        afterAll(() => {
            NOTCH_PAY_CONFIG.webhookSecret = previousSecret;
        });

        it('should process a correctly signed NotchPay webhook', async () => {
            const payment = await Payment.create({
                transactionId: 'WEBHOOK_TEST_123',
                gateway: 'NotchPay',
                userId: clientUser.id,
                type: 'contact_premium',
                amount: 500,
                currency: 'XAF',
                status: 'PENDING',
                description: 'Webhook test payment'
            });

            const res = await signedRequest({
                event: 'payment.completed',
                data: {
                    reference: 'trx.test_123',
                    merchant_reference: 'WEBHOOK_TEST_123',
                    status: 'complete'
                }
            });

            expect(res.statusCode).toBe(200);
            expect(res.text).toBe('OK');

            const updatedPayment = await Payment.findByPk(payment.id);
            expect(updatedPayment.status).toBe('ACCEPTED');
        });

        it('should reject an unsigned webhook (the money bug)', async () => {
            const payment = await Payment.create({
                transactionId: 'WEBHOOK_UNSIGNED_1',
                gateway: 'NotchPay',
                userId: clientUser.id,
                type: 'subscription',
                amount: 5000,
                currency: 'XAF',
                status: 'PENDING',
                providerId: null,
                description: 'Unsigned webhook attempt'
            });

            const res = await request(app)
                .post('/api/payments/notchpay/webhook')
                .send({
                    event: 'payment.complete',
                    data: { merchant_reference: 'WEBHOOK_UNSIGNED_1', status: 'complete' }
                });

            expect(res.statusCode).toBe(401);

            // The payment must NOT have been accepted.
            const stillPending = await Payment.findByPk(payment.id);
            expect(stillPending.status).toBe('PENDING');
        });

        it('should handle missing payment gracefully (when signed)', async () => {
            const res = await signedRequest({
                event: 'payment.completed',
                data: {
                    reference: 'trx.test_123',
                    merchant_reference: 'NONEXISTENT',
                    status: 'complete'
                }
            });

            expect(res.statusCode).toBe(404);
            expect(res.text).toBe('Payment not found');
        });

        it('should reject an invalid signature', async () => {
            const res = await request(app)
                .post('/api/payments/notchpay/webhook')
                .set('x-notch-signature', 'invalid-signature')
                .send({
                    event: 'payment.completed',
                    data: {
                        reference: 'trx.test_123',
                        merchant_reference: 'WEBHOOK_TEST_123',
                        status: 'complete'
                    }
                });

            expect(res.statusCode).toBe(401);
            expect(res.text).toBe('Invalid signature');
        });
    });

    describe('GET /api/admin/payments', () => {
        it('should list all payments for admin', async () => {
            const res = await request(app)
                .get('/api/admin/payments')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/payments/history', () => {
        it('should return client payment history', async () => {
            const res = await request(app)
                .get('/api/payments/history')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
