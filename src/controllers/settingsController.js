const { PlatformSetting, AuditLog } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { i18nResponse } = require('../utils/helpers');
const { invalidateSetting, validateSettingInput } = require('../utils/settings');

/**
 * @desc    List all platform settings
 * @route   GET /api/admin/settings
 * @access  Private (admin)
 */
const listSettings = asyncHandler(async (req, res) => {
    const rows = await PlatformSetting.findAll({ order: [['key', 'ASC']] });
    const settings = rows.map((r) => r.toPublic());
    i18nResponse(req, res, 200, 'common.list', { settings });
});

/**
 * @desc    Get one platform setting by key
 * @route   GET /api/admin/settings/:key
 * @access  Private (admin)
 */
const getOneSetting = asyncHandler(async (req, res) => {
    const row = await PlatformSetting.findOne({ where: { key: req.params.key } });
    if (!row) {
        throw new AppError(req.t('settings.notFound') || 'Setting not found', 404);
    }
    i18nResponse(req, res, 200, 'common.details', { setting: row.toPublic() });
});

/**
 * @desc    Update one platform setting
 * @route   PUT /api/admin/settings/:key
 * @access  Private (admin)
 *
 * Body: { value: <typed value> }
 */
const updateSetting = asyncHandler(async (req, res) => {
    const row = await PlatformSetting.findOne({ where: { key: req.params.key } });
    if (!row) {
        throw new AppError(req.t('settings.notFound') || 'Setting not found', 404);
    }

    const { ok, value, message } = validateSettingInput(row, req.body.value);
    if (!ok) {
        throw new AppError(message, 400);
    }

    const oldValue = row.value;
    const newRaw = PlatformSetting.serializeValue(value, row.valueType);

    row.value = newRaw;
    await row.save({ fields: ['value'] });

    await invalidateSetting(row.key);

    // Audit: who changed what (best-effort, don't block the response)
    AuditLog.log({
        userId: req.user?.id,
        action: 'update',
        entityType: 'PlatformSetting',
        entityId: row.id,
        oldValues: { value: oldValue },
        newValues: { value: newRaw },
        req
    }).catch(() => null);

    i18nResponse(req, res, 200, 'common.updated', { setting: row.toPublic() });
});

/**
 * @desc    Reset a platform setting to its default value
 * @route   POST /api/admin/settings/:key/reset
 * @access  Private (admin)
 */
const resetSetting = asyncHandler(async (req, res) => {
    const row = await PlatformSetting.findOne({ where: { key: req.params.key } });
    if (!row) {
        throw new AppError(req.t('settings.notFound') || 'Setting not found', 404);
    }

    const oldValue = row.value;
    row.value = row.defaultValue;
    await row.save({ fields: ['value'] });

    await invalidateSetting(row.key);

    AuditLog.log({
        userId: req.user?.id,
        action: 'reset',
        entityType: 'PlatformSetting',
        entityId: row.id,
        oldValues: { value: oldValue },
        newValues: { value: row.defaultValue },
        req
    }).catch(() => null);

    i18nResponse(req, res, 200, 'common.updated', { setting: row.toPublic() });
});

module.exports = {
    listSettings,
    getOneSetting,
    updateSetting,
    resetSetting
};
