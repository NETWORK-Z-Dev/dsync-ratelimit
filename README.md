# dSyncRateLimit

This small library is part of the dSync concept and will handle rate limits by either defining and using custom, generic rate limits or by using an express middleware to enforce rate limits.

------

## Basics

```js
import RateLimiter from "@hackthedev/dsync-ratelimit";

const rateLimiter = new RateLimiter({
    getIpLimit: async (req) => {
        if (!req.user) return 20;
        if (req.user.plan === "pro") return 200;
        return 50;
    },

    getTotalLimit: async () => 100,

    getBlockUntil: async (req) => {
        if (req.path === "/login") {
            return new Date(Date.now() + 60_000);
        }
        return null;
    }
});

```

------

## Example Endpoint

```js
app.post(
    "/login",
    rateLimiter.middleware({
        getIpLimit: async () => 5,
        getTotalLimit: async () => 5,
        getBlockUntil: async () => new Date(Date.now() + 5 * 60_000)
    }),
    loginHandler
);

// another way
app.get(
    "/login",
    rateLimiter.middleware({
        getIpLimit: async (req) => {
            if (req.user?.admin) return 1000;
            return 50;
        }
    }),
    handler
);

```

