import dSyncIPSec from '@hackthedev/dsync-ipsec';

export default class dSyncRateLimit {
    constructor({
                    windowMs = 10_000,
                    trustProxy = true,
                    getIpLimit = async () => Infinity,
                    getTotalLimit = async () => Infinity,
                    getBlockUntil = async () => null
                } = {}) {


        this.ipsec = new dSyncIPSec();

        this.windowMs = windowMs;
        this.trustProxy = trustProxy;
        this.getIpLimit = getIpLimit;
        this.getTotalLimit = getTotalLimit;
        this.getBlockUntil = getBlockUntil;
        this.store = new Map();
    }

    now() {
        return Date.now();
    }

    check(key, limit, blockUntilDate = null) {
        const now = Date.now();
        let rec = this.store.get(key);

        if (!rec || now >= rec.resetAt) {
            rec = {
                count: 0,
                resetAt: now + this.windowMs,
                blockedUntil: 0
            };
            this.store.set(key, rec);
        }

        if (rec.blockedUntil && now < rec.blockedUntil) {
            return { ok: false, blocked: true, blockedUntil: rec.blockedUntil };
        }

        rec.count++;

        if (rec.count > limit && blockUntilDate instanceof Date) {
            rec.blockedUntil = blockUntilDate.getTime();
        }

        return {
            ok: rec.count <= limit,
            remaining: Math.max(0, limit - rec.count),
            resetAt: rec.resetAt
        };
    }


    middleware(overrides = {}) {
        return async (req, res, next) => {
            const getIpLimit = overrides.getIpLimit || this.getIpLimit;
            const getTotalLimit = overrides.getTotalLimit || this.getTotalLimit;
            const getBlockUntil = overrides.getBlockUntil || this.getBlockUntil;

            const ip = this.ipsec.getClientIp(req);
            const sig = `${req.method} ${req.path}`;

            const blockUntil = getBlockUntil ? await getBlockUntil(req) : null;

            if (getIpLimit) {
                if (!this.check(`ip:${ip}`, await getIpLimit(req), blockUntil).ok) {
                    return res.sendStatus(429);
                }
            }

            if (getTotalLimit) {
                if (!this.check(`sig:${sig}`, await getTotalLimit(req), blockUntil).ok) {
                    return res.sendStatus(429);
                }
            }

            next();
        };
    }

}
