/**
 * Unit tests for the referralController dashboard endpoints.
 */

jest.mock('../../src/models', () => ({
    Referral: {
        findAll: jest.fn(),
        findAndCountAll: jest.fn()
    },
    User: {
        findByPk: jest.fn()
    }
}));

jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: (req, res, statusCode, key, data) => {
        res.status(statusCode).json({ success: true, message: key, data });
    },
    getPaginationParams: (page, limit) => ({
        limit: Number(limit) || 20,
        offset: ((Number(page) || 1) - 1) * (Number(limit) || 20)
    }),
    getPaginationData: (page, limit, total) => ({
        currentPage: Number(page) || 1,
        totalItems: total,
        itemsPerPage: Number(limit) || 20
    }),
    getFrontendUrl: (role) => (
        role === 'admin' ? 'https://admin.aeli.cm' : 'https://app.aeli.cm'
    )
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

const {
    getMyReferralCode,
    getMyReferrals,
    getMyReferralStats
} = require('../../src/controllers/referralController');
const { Referral, User } = require('../../src/models');

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('referralController', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: {}, body: {}, query: {}, user: { id: 'user-1' }, t: (k) => k };
        res = buildRes();
    });

    describe('getMyReferralCode', () => {
        it('returns the user code and a role-aware shareable URL', async () => {
            User.findByPk.mockResolvedValue({
                id: 'user-1', role: 'provider', referralCode: 'AELI-XYZ123'
            });

            await getMyReferralCode(req, res);

            const payload = res.json.mock.calls[0][0];
            expect(payload.data.referralCode).toBe('AELI-XYZ123');
            expect(payload.data.shareUrl).toBe('https://app.aeli.cm/register?ref=AELI-XYZ123');
        });

        it('uses the admin domain for admin users', async () => {
            User.findByPk.mockResolvedValue({
                id: 'user-1', role: 'admin', referralCode: 'AELI-OPS999'
            });

            await getMyReferralCode(req, res);

            const payload = res.json.mock.calls[0][0];
            expect(payload.data.shareUrl).toBe('https://admin.aeli.cm/register?ref=AELI-OPS999');
        });

        it('returns null shareUrl when the user has no code yet', async () => {
            User.findByPk.mockResolvedValue({
                id: 'user-1', role: 'provider', referralCode: null
            });

            await getMyReferralCode(req, res);

            const payload = res.json.mock.calls[0][0];
            expect(payload.data.referralCode).toBeNull();
            expect(payload.data.shareUrl).toBeNull();
        });

        it('404s when the user is gone', async () => {
            User.findByPk.mockResolvedValue(null);
            await expect(getMyReferralCode(req, res)).rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe('getMyReferrals', () => {
        it('returns referrals with masked referred-user name', async () => {
            Referral.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: [
                    {
                        toJSON: () => ({
                            id: 'ref-1',
                            status: 'rewarded',
                            codeUsed: 'AELI-ABC',
                            rewardDays: 7,
                            rewardedAt: new Date('2026-04-01'),
                            createdAt: new Date('2026-03-28'),
                            referredUser: {
                                firstName: 'Marie',
                                lastName: 'Kamga',
                                isEmailVerified: true
                            }
                        })
                    }
                ]
            });

            await getMyReferrals(req, res);

            const payload = res.json.mock.calls[0][0];
            expect(payload.data.referrals).toHaveLength(1);
            const first = payload.data.referrals[0];
            expect(first.status).toBe('rewarded');
            expect(first.rewardDays).toBe(7);
            expect(first.referredUser.displayName).toBe('Marie K.');
            expect(first.referredUser.isEmailVerified).toBe(true);
        });

        it('filters by status when valid', async () => {
            Referral.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
            req.query.status = 'pending';

            await getMyReferrals(req, res);

            const where = Referral.findAndCountAll.mock.calls[0][0].where;
            expect(where).toEqual({ referrerId: 'user-1', status: 'pending' });
        });

        it('ignores an unknown status filter', async () => {
            Referral.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
            req.query.status = 'banana';

            await getMyReferrals(req, res);

            const where = Referral.findAndCountAll.mock.calls[0][0].where;
            expect(where).toEqual({ referrerId: 'user-1' });
        });

        it('handles missing lastName gracefully (only first name)', async () => {
            Referral.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: [{
                    toJSON: () => ({
                        id: 'r', status: 'pending',
                        referredUser: { firstName: 'Aïcha', lastName: null }
                    })
                }]
            });

            await getMyReferrals(req, res);
            const r = res.json.mock.calls[0][0].data.referrals[0];
            expect(r.referredUser.displayName).toBe('Aïcha');
        });
    });

    describe('getMyReferralStats', () => {
        it('aggregates counts per status and sums reward days', async () => {
            Referral.findAll
                .mockResolvedValueOnce([
                    { status: 'pending' },
                    { status: 'pending' },
                    { status: 'rewarded' },
                    { status: 'rewarded' },
                    { status: 'rewarded' },
                    { status: 'revoked' }
                ])
                .mockResolvedValueOnce([
                    { rewardDays: 7 },
                    { rewardDays: 7 },
                    { rewardDays: 14 }
                ]);

            await getMyReferralStats(req, res);

            const stats = res.json.mock.calls[0][0].data.stats;
            expect(stats).toEqual({
                total: 6,
                pending: 2,
                rewarded: 3,
                revoked: 1,
                totalDaysEarned: 28
            });
        });

        it('returns all zeros when no referrals exist', async () => {
            Referral.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
            await getMyReferralStats(req, res);
            const stats = res.json.mock.calls[0][0].data.stats;
            expect(stats.total).toBe(0);
            expect(stats.totalDaysEarned).toBe(0);
        });
    });
});
