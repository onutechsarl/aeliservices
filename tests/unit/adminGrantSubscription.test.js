/**
 * Tests for the admin "grant a subscription period" endpoint
 * (POST /api/admin/providers/:id/grant-subscription).
 */

const mockApplyBonusDays = jest.fn();
const mockAuditLogMock = jest.fn();
const mockGetSetting = jest.fn();
const mockGrantedEmail = jest.fn(() => ({ subject: 's', html: 'h' }));
const mockSendEmailSafely = jest.fn();

jest.mock('../../src/models', () => ({
    User: { findOne: jest.fn(), findByPk: jest.fn() },
    Provider: { findByPk: jest.fn() },
    Service: {},
    Review: {},
    Contact: {},
    Category: {},
    Payment: {},
    ProviderApplication: {},
    Subscription: { applyBonusDays: (...a) => mockApplyBonusDays(...a) },
    AuditLog: { log: (...a) => mockAuditLogMock(...a), findAll: jest.fn() }
}));

jest.mock('../../src/utils/settings', () => ({
    getSetting: (...args) => mockGetSetting(...args)
}));

jest.mock('../../src/utils/emailTemplates', () => ({
    accountVerifiedEmail: jest.fn(),
    providerFeaturedEmail: jest.fn(),
    providerVerificationRevokedEmail: jest.fn(),
    providerDeactivatedEmail: jest.fn(),
    providerReactivatedEmail: jest.fn(),
    subscriptionGrantedByAdminEmail: (...a) => mockGrantedEmail(...a)
}));

jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: (req, res, statusCode, key, data) => {
        res.status(statusCode).json({ success: true, message: key, data });
    },
    getPaginationParams: () => ({ limit: 10, offset: 0 }),
    getPaginationData: () => ({}),
    sendEmailSafely: (...a) => mockSendEmailSafely(...a),
    buildSortOrder: () => undefined
}));

jest.mock('../../src/middlewares/errorHandler', () => ({
    asyncHandler: (fn) => fn,
    AppError: class extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

jest.mock('../../src/middlewares/audit', () => ({
    auditLogger: {
        userStatusChanged: jest.fn(),
        adminAction: jest.fn()
    }
}));

jest.mock('../../src/config/redis', () => ({
    delByPattern: (...args) => Promise.resolve(),
    del: (...args) => Promise.resolve(),
    cacheKeys: { provider: (id) => `providers:${id}` }
}));

jest.mock('../../src/services/referralReward', () => ({
    rollbackIfApplicable: (...args) => Promise.resolve({ status: 'noop' })
}));

const { grantSubscription, getGrantHistory } = require('../../src/controllers/adminController');
const { Provider, AuditLog } = require('../../src/models');

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('grantSubscription', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetSetting.mockResolvedValue(365);
        mockAuditLogMock.mockResolvedValue();
        mockSendEmailSafely.mockResolvedValue();
        req = {
            params: { id: 'provider-1' },
            body: {},
            user: { id: 'admin-1' },
            t: (k) => k
        };
        res = buildRes();
    });

    it('rejects when reason is missing or too short', async () => {
        req.body = { days: 7, reason: '   ' };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });

        req.body = { days: 7 };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects non-integer or non-positive days', async () => {
        req.body = { days: 0, reason: 'test grant' };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });

        req.body = { days: -5, reason: 'test grant' };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });

        req.body = { days: 'banana', reason: 'test grant' };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });

        req.body = { days: 1.5, reason: 'test grant' };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects when days exceeds adminGrant.maxDays', async () => {
        mockGetSetting.mockResolvedValue(30);
        req.body = { days: 60, reason: 'too much love' };
        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('returns 404 when provider is unknown', async () => {
        req.body = { days: 7, reason: 'compensation' };
        Provider.findByPk.mockResolvedValue(null);

        await expect(grantSubscription(req, res)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('grants the bonus and writes an audit log on success', async () => {
        req.body = { days: 14, reason: 'partnership' };
        Provider.findByPk.mockResolvedValue({
            id: 'provider-1',
            businessName: 'Eco Prestige',
            user: { id: 'user-1', email: 'pro@aeli.cm', firstName: 'Marie' }
        });
        const newEnd = new Date('2027-01-01');
        mockApplyBonusDays.mockResolvedValue({ id: 'sub-1', endDate: newEnd });

        await grantSubscription(req, res);

        expect(mockApplyBonusDays).toHaveBeenCalledWith('provider-1', 14);
        expect(mockAuditLogMock).toHaveBeenCalled();
        const auditPayload = mockAuditLogMock.mock.calls[0][0];
        expect(auditPayload).toMatchObject({
            userId: 'admin-1',
            action: 'grant',
            entityType: 'AdminSubscriptionGrant',
            entityId: 'provider-1'
        });
        expect(auditPayload.newValues).toMatchObject({ days: 14, reason: 'partnership' });
        expect(mockSendEmailSafely).toHaveBeenCalled();

        const body = res.json.mock.calls[0][0];
        expect(body.data).toMatchObject({ providerId: 'provider-1', days: 14 });
    });

    it('does not crash when the provider has no email user attached', async () => {
        req.body = { days: 5, reason: 'compensation' };
        Provider.findByPk.mockResolvedValue({
            id: 'provider-1',
            businessName: 'Eco Prestige',
            user: null
        });
        mockApplyBonusDays.mockResolvedValue({ id: 'sub-1', endDate: new Date() });

        await grantSubscription(req, res);

        expect(mockSendEmailSafely).not.toHaveBeenCalled();
        expect(mockAuditLogMock).toHaveBeenCalled();
    });
});

describe('getGrantHistory', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: { id: 'provider-1' }, user: { id: 'admin-1' }, t: (k) => k };
        res = buildRes();
    });

    it('returns the grant history with grantedBy info', async () => {
        AuditLog.findAll.mockResolvedValue([
            {
                toJSON: () => ({
                    id: 'log-1',
                    createdAt: new Date('2026-04-01'),
                    user: { id: 'admin-1', firstName: 'Op', lastName: 'Aeli', email: 'ops@aeli.cm' },
                    newValues: { days: 14, reason: 'partnership', newEndDate: new Date('2027-01-01') }
                })
            }
        ]);

        await getGrantHistory(req, res);

        const payload = res.json.mock.calls[0][0];
        expect(payload.data.grants).toHaveLength(1);
        expect(payload.data.grants[0]).toMatchObject({
            days: 14,
            reason: 'partnership',
            grantedBy: { id: 'admin-1', firstName: 'Op' }
        });
    });

    it('handles a missing grantedBy user gracefully', async () => {
        AuditLog.findAll.mockResolvedValue([
            { toJSON: () => ({ id: 'log-1', createdAt: new Date(), user: null, newValues: { days: 3 } }) }
        ]);

        await getGrantHistory(req, res);

        const grants = res.json.mock.calls[0][0].data.grants;
        expect(grants[0].grantedBy).toBeNull();
    });
});
