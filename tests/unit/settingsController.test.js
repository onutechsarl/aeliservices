/**
 * Unit tests for the settingsController (admin platform settings).
 */

const parseInline = (raw, type) => {
    if (raw === null || raw === undefined) return raw;
    if (type === 'int') return parseInt(raw, 10);
    if (type === 'float') return parseFloat(raw);
    if (type === 'bool') return raw === 'true' || raw === '1' || raw === true;
    if (type === 'json') {
        try { return JSON.parse(raw); } catch (e) { return null; }
    }
    return String(raw);
};

const serializeInline = (value, type) => {
    if (value === null || value === undefined) return null;
    if (type === 'json') return JSON.stringify(value);
    return String(value);
};

const mockAuditLog = jest.fn();

jest.mock('../../src/models', () => ({
    PlatformSetting: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        parseValue: parseInline,
        serializeValue: serializeInline
    },
    AuditLog: {
        log: (...args) => {
            mockAuditLog(...args);
            return Promise.resolve();
        }
    }
}));

jest.mock('../../src/utils/helpers', () => ({
    i18nResponse: jest.fn()
}));

jest.mock('../../src/utils/settings', () => ({
    invalidateSetting: jest.fn(() => Promise.resolve()),
    validateSettingInput: (row, raw) => {
        const type = row.valueType;
        if (raw === undefined || raw === null) return { ok: false, message: 'Value is required' };
        if (type === 'int' || type === 'float') {
            const n = type === 'int' ? parseInt(raw, 10) : parseFloat(raw);
            if (Number.isNaN(n)) return { ok: false, message: 'Expected number' };
            if (row.minValue !== null && row.minValue !== undefined) {
                const min = parseFloat(row.minValue);
                if (n < min) return { ok: false, message: `Minimum is ${min}` };
            }
            if (row.maxValue !== null && row.maxValue !== undefined) {
                const max = parseFloat(row.maxValue);
                if (n > max) return { ok: false, message: `Maximum is ${max}` };
            }
            return { ok: true, value: n };
        }
        if (type === 'bool') return { ok: true, value: raw === true || raw === 'true' };
        return { ok: true, value: String(raw) };
    }
}));

jest.mock('../../src/middlewares/errorHandler', () => {
    class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
    return { asyncHandler: (fn) => fn, AppError };
});

const {
    listSettings,
    getOneSetting,
    updateSetting,
    resetSetting
} = require('../../src/controllers/settingsController');
const { PlatformSetting } = require('../../src/models');
const { invalidateSetting } = require('../../src/utils/settings');
const { i18nResponse } = require('../../src/utils/helpers');

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const buildSetting = (overrides = {}) => {
    const o = {
        id: 'setting-1',
        key: 'referral.rewardDays',
        value: '7',
        defaultValue: '7',
        valueType: 'int',
        description: 'Days awarded',
        minValue: '1',
        maxValue: '365',
        save: jest.fn(() => Promise.resolve()),
        ...overrides
    };
    o.toPublic = function () {
        return {
            key: this.key,
            value: parseInline(this.value, this.valueType),
            defaultValue: parseInline(this.defaultValue, this.valueType),
            valueType: this.valueType
        };
    };
    return o;
};

describe('settingsController', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: {}, body: {}, t: (key) => key, user: { id: 'admin-1' } };
        res = buildRes();
    });

    describe('listSettings', () => {
        it('returns all platform settings', async () => {
            PlatformSetting.findAll.mockResolvedValue([
                buildSetting(),
                buildSetting({ key: 'referral.monthlyCap', value: '20' })
            ]);

            await listSettings(req, res);

            expect(PlatformSetting.findAll).toHaveBeenCalledWith({ order: [['key', 'ASC']] });
            const call = i18nResponse.mock.calls[0];
            expect(call[2]).toBe(200);
            expect(call[4].settings).toHaveLength(2);
        });
    });

    describe('getOneSetting', () => {
        it('returns 404 when key is unknown', async () => {
            PlatformSetting.findOne.mockResolvedValue(null);
            req.params.key = 'missing.key';

            await expect(getOneSetting(req, res)).rejects.toMatchObject({ statusCode: 404 });
        });

        it('returns the parsed setting', async () => {
            PlatformSetting.findOne.mockResolvedValue(buildSetting());
            req.params.key = 'referral.rewardDays';

            await getOneSetting(req, res);

            const call = i18nResponse.mock.calls[0];
            expect(call[2]).toBe(200);
            expect(call[4].setting).toMatchObject({ key: 'referral.rewardDays', value: 7 });
        });
    });

    describe('updateSetting', () => {
        it('updates the value, invalidates cache and audits', async () => {
            const row = buildSetting();
            PlatformSetting.findOne.mockResolvedValue(row);
            req.params.key = 'referral.rewardDays';
            req.body.value = 14;

            await updateSetting(req, res);

            expect(row.value).toBe('14');
            expect(row.save).toHaveBeenCalledWith({ fields: ['value'] });
            expect(invalidateSetting).toHaveBeenCalledWith('referral.rewardDays');
            expect(i18nResponse).toHaveBeenCalled();
        });

        it('rejects a value below the minimum', async () => {
            const row = buildSetting();
            PlatformSetting.findOne.mockResolvedValue(row);
            req.params.key = 'referral.rewardDays';
            req.body.value = 0;

            await expect(updateSetting(req, res)).rejects.toMatchObject({ statusCode: 400 });
            expect(row.save).not.toHaveBeenCalled();
        });

        it('rejects a value above the maximum', async () => {
            const row = buildSetting();
            PlatformSetting.findOne.mockResolvedValue(row);
            req.params.key = 'referral.rewardDays';
            req.body.value = 9999;

            await expect(updateSetting(req, res)).rejects.toMatchObject({ statusCode: 400 });
            expect(row.save).not.toHaveBeenCalled();
        });

        it('returns 404 for unknown key', async () => {
            PlatformSetting.findOne.mockResolvedValue(null);
            req.params.key = 'missing';

            await expect(updateSetting(req, res)).rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe('resetSetting', () => {
        it('restores the default value', async () => {
            const row = buildSetting({ value: '42', defaultValue: '7' });
            PlatformSetting.findOne.mockResolvedValue(row);
            req.params.key = 'referral.rewardDays';

            await resetSetting(req, res);

            expect(row.value).toBe('7');
            expect(row.save).toHaveBeenCalledWith({ fields: ['value'] });
            expect(invalidateSetting).toHaveBeenCalledWith('referral.rewardDays');
        });

        it('returns 404 for unknown key', async () => {
            PlatformSetting.findOne.mockResolvedValue(null);
            req.params.key = 'missing';

            await expect(resetSetting(req, res)).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});
