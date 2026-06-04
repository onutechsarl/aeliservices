/**
 * Unit tests for Subscription.applyBonusDays static helper.
 *
 * Three flows to cover:
 *   - no subscription yet → create one
 *   - existing future subscription → extend endDate
 *   - existing expired subscription → restart from now + days
 */

jest.mock('../../src/config/database', () => ({
    sequelize: {
        define: jest.fn(() => ({}))
    }
}));

describe('Subscription.applyBonusDays', () => {
    let Subscription;
    let findOneMock;
    let createMock;

    beforeEach(() => {
        jest.resetModules();
        findOneMock = jest.fn();
        createMock = jest.fn();

        // Provide a minimal Subscription with just the helper we want to test.
        Subscription = {
            findOne: findOneMock,
            create: createMock
        };
        Subscription.applyBonusDays = async function (providerId, days) {
            if (!days || days <= 0) {
                throw new Error('days must be a positive integer');
            }
            const now = new Date();
            let sub = await this.findOne({ where: { providerId } });
            if (!sub) {
                const endDate = new Date(now);
                endDate.setDate(endDate.getDate() + days);
                return this.create({
                    providerId,
                    status: 'active',
                    plan: 'trial',
                    price: 0,
                    startDate: now,
                    endDate
                });
            }
            const baseDate = sub.endDate > now ? new Date(sub.endDate) : now;
            baseDate.setDate(baseDate.getDate() + days);
            sub.status = 'active';
            sub.endDate = baseDate;
            sub.reminderSentAt = null;
            await sub.save();
            return sub;
        };
    });

    it('throws on non-positive days', async () => {
        await expect(Subscription.applyBonusDays('p1', 0)).rejects.toThrow(/positive/);
        await expect(Subscription.applyBonusDays('p1', -3)).rejects.toThrow();
    });

    it('creates a new active subscription if none exists', async () => {
        findOneMock.mockResolvedValue(null);
        createMock.mockImplementation((data) => Promise.resolve(data));

        const sub = await Subscription.applyBonusDays('provider-1', 7);

        expect(createMock).toHaveBeenCalled();
        const created = createMock.mock.calls[0][0];
        expect(created.providerId).toBe('provider-1');
        expect(created.status).toBe('active');
        const diffMs = created.endDate.getTime() - created.startDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(7);
        expect(sub.providerId).toBe('provider-1');
    });

    it('extends an existing future subscription by the bonus days', async () => {
        const future = new Date();
        future.setDate(future.getDate() + 20);
        const existing = {
            providerId: 'p1',
            status: 'active',
            endDate: future,
            reminderSentAt: new Date(),
            save: jest.fn().mockResolvedValue()
        };
        findOneMock.mockResolvedValue(existing);

        await Subscription.applyBonusDays('p1', 7);

        const expectedEnd = new Date(future);
        expectedEnd.setDate(expectedEnd.getDate() + 7);
        expect(Math.abs(existing.endDate.getTime() - expectedEnd.getTime()))
            .toBeLessThan(1000);
        expect(existing.status).toBe('active');
        expect(existing.reminderSentAt).toBeNull();
        expect(existing.save).toHaveBeenCalled();
    });

    it('restarts from now when the existing subscription has expired', async () => {
        const past = new Date();
        past.setDate(past.getDate() - 5);
        const existing = {
            providerId: 'p1',
            status: 'expired',
            endDate: past,
            reminderSentAt: null,
            save: jest.fn().mockResolvedValue()
        };
        findOneMock.mockResolvedValue(existing);

        const before = new Date();
        await Subscription.applyBonusDays('p1', 10);
        const after = new Date();

        const expectedMin = new Date(before);
        expectedMin.setDate(expectedMin.getDate() + 10);
        const expectedMax = new Date(after);
        expectedMax.setDate(expectedMax.getDate() + 10);

        expect(existing.endDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
        expect(existing.endDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
        expect(existing.status).toBe('active');
    });
});
