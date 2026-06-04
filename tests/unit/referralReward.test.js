/**
 * Unit tests for the referralReward service.
 *
 * The service must:
 *  - be a no-op when there's no pending referral
 *  - revoke if the referrer is gone / inactive / over the monthly cap /
 *    has no Provider profile
 *  - apply the bonus to the existing subscription otherwise
 *  - never throw — errors are swallowed and logged
 */

jest.mock('../../src/models', () => ({
    Referral: {
        findOne: jest.fn(),
        count: jest.fn()
    },
    User: {
        findByPk: jest.fn()
    },
    Provider: {
        findOne: jest.fn()
    },
    Subscription: {
        applyBonusDays: jest.fn()
    },
    AuditLog: {
        log: (...args) => Promise.resolve()
    }
}));

jest.mock('../../src/utils/settings', () => ({
    getSetting: jest.fn()
}));

jest.mock('../../src/utils/helpers', () => ({
    sendEmailSafely: (...args) => Promise.resolve()
}));

jest.mock('../../src/utils/emailTemplates', () => ({
    referralRewardedEmail: jest.fn(() => ({ subject: 's', html: 'h' }))
}));

jest.mock('../../src/utils/logger', () => ({
    error: jest.fn(),
    warn: jest.fn(), info: jest.fn(), debug: jest.fn()
}));

const { attemptReward } = require('../../src/services/referralReward');
const { Referral, User, Provider, Subscription } = require('../../src/models');
const { getSetting } = require('../../src/utils/settings');

const buildReferral = (overrides = {}) => ({
    id: 'ref-1',
    referrerId: 'referrer-1',
    referredUserId: 'newbie-1',
    status: 'pending',
    save: jest.fn().mockResolvedValue(),
    ...overrides
});

describe('referralReward.attemptReward', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSetting.mockImplementation((key, def) => {
            if (key === 'referral.monthlyCap') return Promise.resolve(20);
            if (key === 'referral.rewardDays') return Promise.resolve(7);
            return Promise.resolve(def);
        });
    });

    it('returns noop when no pending referral exists', async () => {
        Referral.findOne.mockResolvedValue(null);
        const r = await attemptReward('newbie-1');
        expect(r.status).toBe('noop');
        expect(Subscription.applyBonusDays).not.toHaveBeenCalled();
    });

    it('revokes when the referrer no longer exists', async () => {
        const referral = buildReferral();
        Referral.findOne.mockResolvedValue(referral);
        User.findByPk.mockResolvedValue(null);

        const r = await attemptReward('newbie-1');

        expect(r.status).toBe('revoked');
        expect(referral.status).toBe('revoked');
        expect(referral.revokedReason).toContain('no longer exists');
    });

    it('revokes when the referrer is inactive', async () => {
        const referral = buildReferral();
        Referral.findOne.mockResolvedValue(referral);
        User.findByPk.mockResolvedValue({ id: 'referrer-1', isActive: false });

        const r = await attemptReward('newbie-1');

        expect(r.status).toBe('revoked');
        expect(referral.status).toBe('revoked');
        expect(referral.revokedReason).toMatch(/inactive/);
    });

    it('revokes when the monthly cap is reached', async () => {
        const referral = buildReferral();
        Referral.findOne.mockResolvedValue(referral);
        User.findByPk.mockResolvedValue({ id: 'referrer-1', isActive: true });
        Referral.count.mockResolvedValue(20); // hit cap

        const r = await attemptReward('newbie-1');

        expect(r.status).toBe('revoked');
        expect(referral.revokedReason).toMatch(/cap/i);
        expect(Subscription.applyBonusDays).not.toHaveBeenCalled();
    });

    it('revokes when the referrer has no Provider profile', async () => {
        const referral = buildReferral();
        Referral.findOne.mockResolvedValue(referral);
        User.findByPk.mockResolvedValue({ id: 'referrer-1', isActive: true });
        Referral.count.mockResolvedValue(5);
        Provider.findOne.mockResolvedValue(null);

        const r = await attemptReward('newbie-1');

        expect(r.status).toBe('revoked');
        expect(referral.revokedReason).toMatch(/not a provider/);
        expect(Subscription.applyBonusDays).not.toHaveBeenCalled();
    });

    it('applies the bonus and marks the referral rewarded', async () => {
        const referral = buildReferral();
        Referral.findOne.mockResolvedValue(referral);
        User.findByPk.mockResolvedValue({
            id: 'referrer-1', isActive: true, email: 'a@b.c', firstName: 'Marie'
        });
        Referral.count.mockResolvedValue(3);
        Provider.findOne.mockResolvedValue({ id: 'provider-9' });
        const futureDate = new Date('2026-12-31');
        Subscription.applyBonusDays.mockResolvedValue({
            id: 'sub-1', endDate: futureDate
        });

        const r = await attemptReward('newbie-1');

        expect(r.status).toBe('rewarded');
        expect(r.days).toBe(7);
        expect(referral.status).toBe('rewarded');
        expect(referral.rewardDays).toBe(7);
        expect(referral.rewardedAt).toBeInstanceOf(Date);
        expect(Subscription.applyBonusDays).toHaveBeenCalledWith('provider-9', 7);
    });

    it('reads the reward duration from settings (configurable)', async () => {
        getSetting.mockImplementation((key, def) => {
            if (key === 'referral.monthlyCap') return Promise.resolve(20);
            if (key === 'referral.rewardDays') return Promise.resolve(14);
            return Promise.resolve(def);
        });
        const referral = buildReferral();
        Referral.findOne.mockResolvedValue(referral);
        User.findByPk.mockResolvedValue({
            id: 'referrer-1', isActive: true, email: 'a@b.c', firstName: 'Marie'
        });
        Referral.count.mockResolvedValue(0);
        Provider.findOne.mockResolvedValue({ id: 'provider-9' });
        Subscription.applyBonusDays.mockResolvedValue({
            id: 'sub-1', endDate: new Date()
        });

        const r = await attemptReward('newbie-1');

        expect(r.status).toBe('rewarded');
        expect(r.days).toBe(14);
        expect(Subscription.applyBonusDays).toHaveBeenCalledWith('provider-9', 14);
    });

    it('returns error status without throwing when DB blows up', async () => {
        Referral.findOne.mockRejectedValue(new Error('connection lost'));
        const r = await attemptReward('newbie-1');
        expect(r.status).toBe('error');
    });
});
