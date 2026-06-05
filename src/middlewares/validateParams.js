const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reject a request early when one of its path params is not a valid UUID.
 *
 * The frontend occasionally builds URLs from state that has not been
 * hydrated yet (e.g. `/api/services/provider/undefined`). Without this
 * guard the request reaches Postgres which throws a 500
 * `invalid input syntax for type uuid`. With this guard we return a clean
 * 400 with a message naming the offending parameter.
 *
 * Usage: router.get('/foo/:id', validateUuidParam('id'), handler)
 *        router.get('/x/:a/y/:b', validateUuidParam('a', 'b'), handler)
 */
const validateUuidParam = (...paramNames) => {
    return (req, res, next) => {
        for (const name of paramNames) {
            const value = req.params[name];
            if (value === undefined || value === null) continue;
            if (typeof value !== 'string' || !UUID_RE.test(value)) {
                return res.status(400).json({
                    success: false,
                    message: `Paramètre "${name}" invalide : un identifiant au format UUID est attendu.`,
                    code: 'INVALID_UUID_PARAM',
                    param: name
                });
            }
        }
        next();
    };
};

module.exports = { validateUuidParam, UUID_RE };
