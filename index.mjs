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

    calculateConsensus(votes, tolerance = null) {
        if (!votes || votes.length === 0) {
            return { value: null, result: [], disqualified: [] };
        }

        // get median
        const values = votes.map(v => v[1]).sort((a, b) => a - b);
        const median = values.length % 2 === 0
            ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
            : values[Math.floor(values.length / 2)];

        let sumWeighted = 0;
        let sumWeights = 0;

        const result = [];
        const disqualified = [];

        for (const [host, reportedValue, weight] of votes) {
            if (tolerance !== null && Math.abs(reportedValue - median) > tolerance) {
                disqualified.push([host, reportedValue, weight]);
                continue;
            }
            result.push([host, reportedValue, weight]);
            sumWeighted += reportedValue * weight;
            sumWeights += weight;
        }

        const value = sumWeights > 0 ? parseFloat((sumWeighted / sumWeights).toFixed(2)) : null;

        return { value, result, disqualified };
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
