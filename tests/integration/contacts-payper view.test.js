const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { User, Provider, Contact, Subscription, Payment } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Contact Pay-Per-View E2E Tests', () => {
    let providerToken, providerUser, provider, clientToken, clientUser;
    let subscriptionProvider, noSubscriptionProvider;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // Create client user
        clientUser = await User.create({
            email: 'client@test.com',
            password: 'TestPass123!',
            firstName: 'Client',
            lastName: 'Test',
            role: 'client',
            emailVerified: true
        });
        clientToken = jwt.sign({ id: clientUser.id }, process.env.JWT_SECRET);

        // Create provider WITH subscription
        const providerUserWithSub = await User.create({
            email: 'provider.sub@test.com',
            password: 'TestPass123!',
            firstName: 'Provider',
            lastName: 'WithSub',
            role: 'provider',
            emailVerified: true
        });

        subscriptionProvider = await Provider.create({
            userId: providerUserWithSub.id,
            businessName: 'Salon Test Subscribed',
            description: 'Il s\'agit d\'une description de test assez longue pour passer la validation de cinquante caractères minimum.',
            location: 'Douala'
        });

        // Active subscription
        await Subscription.create({
            providerId: subscriptionProvider.id,
            plan: 'monthly',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'active'
        });

        // Create provider WITHOUT subscription
        providerUser = await User.create({
            email: 'provider.nosub@test.com',
            password: 'TestPass123!',
            firstName: 'Provider',
            lastName: 'NoSub',
            role: 'provider',
            emailVerified: true
        });

        noSubscriptionProvider = await Provider.create({
            userId: providerUser.id,
            businessName: 'Salon Test No Sub',
            description: 'Il s\'agit d\'une description de test assez longue pour passer la validation de cinquante caractères minimum.',
            location: 'Yaoundé'
        });

        providerToken = jwt.sign({ id: providerUser.id }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Contact Creation and Locking', () => {
        it('should create an UNLOCKED contact even without subscription (pay-per-view removed)', async () => {
            const res = await request(app)
                .post('/api/contacts')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    providerId: noSubscriptionProvider.id,
                    message: 'Hello, I need a haircut this Saturday morning.',
                    senderName: 'Client Test',
                    senderEmail: 'client@test.com',
                    senderPhone: '+237699123456'
                });

            expect(res.statusCode).toBe(201);

            // Check in database — messages are now unlocked by default.
            const contact = await Contact.findOne({
                where: { providerId: noSubscriptionProvider.id }
            });
            expect(contact.isUnlocked).toBe(true);
            expect(contact.unlockedAt).not.toBeNull();
        });

        it('should auto-unlock contact for provider WITH active subscription', async () => {
            const res = await request(app)
                .post('/api/contacts')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    providerId: subscriptionProvider.id,
                    message: 'Hello, I need a haircut this Saturday morning.',
                    senderName: 'Client Test',
                    senderEmail: 'client@test.com',
                    senderPhone: '+237699123456'
                });

            expect(res.statusCode).toBe(201);

            // Check in database
            const contact = await Contact.findOne({
                where: { providerId: subscriptionProvider.id }
            });
            expect(contact.isUnlocked).toBe(true);
            expect(contact.unlockedAt).not.toBeNull();
        });
    });

    describe('Full Data Retrieval (pay-per-view removed)', () => {
        it('should return full, unlocked data even for a legacy locked row', async () => {
            // Simulate a message stored while the lock was still active.
            const contact = await Contact.create({
                userId: clientUser.id,
                providerId: noSubscriptionProvider.id,
                message: 'This is a test message that should be fully visible',
                senderName: 'John Doe',
                senderEmail: 'john.doe@example.com',
                senderPhone: '+237699888777',
                isUnlocked: false
            });

            const res = await request(app)
                .get('/api/contacts/received')
                .set('Authorization', `Bearer ${providerToken}`);

            expect(res.statusCode).toBe(200);

            const fetched = res.body.data.contacts.find(c => c.id === contact.id);
            expect(fetched).toBeDefined();
            // No masking anymore: the provider sees the real message and details.
            expect(fetched.needsUnlock).toBeUndefined();
            expect(fetched.isUnlocked).toBe(true);
            expect(fetched.message).toBe('This is a test message that should be fully visible');
            expect(fetched.senderEmail).toBe('john.doe@example.com');

            // The legacy row is normalized to unlocked in the database.
            const reloaded = await Contact.findByPk(contact.id);
            expect(reloaded.isUnlocked).toBe(true);
        });
    });

    describe('Contact Unlock via Payment', () => {
        let lockedContact;

        beforeEach(async () => {
            lockedContact = await Contact.create({
                userId: clientUser.id,
                providerId: noSubscriptionProvider.id,
                message: 'Test message for unlock',
                senderName: 'Test Sender',
                senderEmail: 'sender@example.com',
                senderPhone: '+237699111222',
                isUnlocked: false
            });
        });

        it('should no longer require payment to unlock (everything is viewable)', async () => {
            // Pay-per-view removed: the message is already viewable, so trying
            // to start an unlock payment is rejected as "already unlocked".
            const res = await request(app)
                .post(`/api/contacts/${lockedContact.id}/unlock`)
                .set('Authorization', `Bearer ${providerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/déjà débloqué/i);
        });

        it('should reject unlock if already unlocked', async () => {
            // Unlock first
            await lockedContact.update({
                isUnlocked: true,
                unlockedAt: new Date()
            });

            const res = await request(app)
                .post(`/api/contacts/${lockedContact.id}/unlock`)
                .set('Authorization', `Bearer ${providerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/déjà débloqué/i);
        });

        it('should confirm unlock after successful payment', async () => {
            // Create mock payment
            const payment = await Payment.create({
                transactionId: 'TEST_UNLOCK_123',
                userId: providerUser.id,
                providerId: noSubscriptionProvider.id,
                amount: 500,
                currency: 'XAF',
                type: 'contact_unlock',
                status: 'ACCEPTED',
                metadata: { contactId: lockedContact.id }
            });

            const res = await request(app)
                .post(`/api/contacts/${lockedContact.id}/unlock/confirm`)
                .set('Authorization', `Bearer ${providerToken}`)
                .send({ transactionId: payment.transactionId });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.contact.isUnlocked).toBe(true);
            expect(res.body.data.contact.senderEmail).toBe('sender@example.com');
            expect(res.body.data.contact.senderPhone).toBe('+237699111222');
        });
    });
});
