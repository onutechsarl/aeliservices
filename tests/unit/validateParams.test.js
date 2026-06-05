const { validateUuidParam } = require('../../src/middlewares/validateParams');

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('validateUuidParam', () => {
    let next;
    let res;

    beforeEach(() => {
        next = jest.fn();
        res = buildRes();
    });

    it('lets a valid UUID pass through', () => {
        const req = { params: { id: '9d250b87-4443-4430-990c-047a549b36ec' } };
        validateUuidParam('id')(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 when the param is the literal string "undefined"', () => {
        const req = { params: { providerId: 'undefined' } };
        validateUuidParam('providerId')(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        const body = res.json.mock.calls[0][0];
        expect(body.success).toBe(false);
        expect(body.code).toBe('INVALID_UUID_PARAM');
        expect(body.param).toBe('providerId');
    });

    it('returns 400 when the param is "null" or any random string', () => {
        validateUuidParam('id')({ params: { id: 'null' } }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('does not block when the named param is missing (lets the route 404 elsewhere)', () => {
        const req = { params: {} };
        validateUuidParam('id')(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('validates multiple params at once', () => {
        const req = {
            params: {
                providerId: '9d250b87-4443-4430-990c-047a549b36ec',
                serviceId: 'broken-uuid'
            }
        };
        validateUuidParam('providerId', 'serviceId')(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].param).toBe('serviceId');
    });

    it('accepts both upper and lower case UUIDs', () => {
        const req = { params: { id: '9D250B87-4443-4430-990C-047A549B36EC' } };
        validateUuidParam('id')(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
