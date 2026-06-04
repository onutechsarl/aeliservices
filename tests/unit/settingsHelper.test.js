/**
 * Tests for the getSetting() helper and validateSettingInput().
 */

jest.mock('../../src/models/PlatformSetting', () => ({
    findOne: jest.fn(),
    parseValue: jest.requireActual('../../src/models/PlatformSetting').parseValue,
    serializeValue: jest.requireActual('../../src/models/PlatformSetting').serializeValue
}));

jest.mock('../../src/config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
}));

jest.mock('../../src/utils/logger', () => ({
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
}));

const PlatformSetting = require('../../src/models/PlatformSetting');
const cache = require('../../src/config/redis');
const { getSetting, invalidateSetting, validateSettingInput } = require('../../src/utils/settings');

describe('settings helper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSetting', () => {
        it('returns the cached value when present', async () => {
            cache.get.mockResolvedValue(42);

            const v = await getSetting('referral.rewardDays', 7);

            expect(v).toBe(42);
            expect(PlatformSetting.findOne).not.toHaveBeenCalled();
        });

        it('falls back to DB on cache miss and parses by valueType', async () => {
            cache.get.mockResolvedValue(null);
            PlatformSetting.findOne.mockResolvedValue({ value: '14', valueType: 'int' });
            cache.set.mockResolvedValue();

            const v = await getSetting('referral.rewardDays', 7);

            expect(v).toBe(14);
            expect(cache.set).toHaveBeenCalledWith('platform-setting:referral.rewardDays', 14, 300);
        });

        it('returns the default when the key is not registered', async () => {
            cache.get.mockResolvedValue(null);
            PlatformSetting.findOne.mockResolvedValue(null);

            const v = await getSetting('referral.unknown', 99);

            expect(v).toBe(99);
        });

        it('parses bool values correctly', async () => {
            cache.get.mockResolvedValue(null);
            PlatformSetting.findOne.mockResolvedValue({ value: 'true', valueType: 'bool' });

            const v = await getSetting('referral.requireEmailVerified', false);

            expect(v).toBe(true);
        });

        it('returns the default if the DB lookup throws', async () => {
            cache.get.mockResolvedValue(null);
            PlatformSetting.findOne.mockRejectedValue(new Error('boom'));

            const v = await getSetting('referral.rewardDays', 7);

            expect(v).toBe(7);
        });
    });

    describe('invalidateSetting', () => {
        it('calls cache.del with the namespaced key', async () => {
            await invalidateSetting('referral.rewardDays');
            expect(cache.del).toHaveBeenCalledWith('platform-setting:referral.rewardDays');
        });
    });

    describe('validateSettingInput', () => {
        const intRow = { valueType: 'int', minValue: '1', maxValue: '100' };
        const boolRow = { valueType: 'bool', minValue: null, maxValue: null };

        it('accepts an int inside bounds', () => {
            expect(validateSettingInput(intRow, 50)).toEqual({ ok: true, value: 50 });
        });

        it('rejects an int below min', () => {
            const r = validateSettingInput(intRow, 0);
            expect(r.ok).toBe(false);
            expect(r.message).toContain('Minimum');
        });

        it('rejects an int above max', () => {
            const r = validateSettingInput(intRow, 101);
            expect(r.ok).toBe(false);
            expect(r.message).toContain('Maximum');
        });

        it('rejects a non-numeric int input', () => {
            const r = validateSettingInput(intRow, 'foo');
            expect(r.ok).toBe(false);
        });

        it('coerces "true"/"false" to bool', () => {
            expect(validateSettingInput(boolRow, 'true')).toEqual({ ok: true, value: true });
            expect(validateSettingInput(boolRow, 'false')).toEqual({ ok: true, value: false });
        });

        it('rejects undefined value', () => {
            expect(validateSettingInput(intRow, undefined).ok).toBe(false);
        });
    });
});
