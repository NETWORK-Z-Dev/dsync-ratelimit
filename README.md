# dSyncRateLimit

This small library is part of the dSync concept and will handle rate limits by either defining and using custom, generic rate limits or by using an express middleware to enforce rate limits.

------

## Basics

```js
import dSyncRateLimit from "@hackthedev/dsync-ratelimit";

const rateLimiter = new dSyncRateLimit({
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

## Example express endpoint

The following example code is just an example and meant to showcase how the rate limit middleware can be used.

```js
app.post(
    "/login",
    rateLimiter.middleware({
        getIpLimit: async () => 5,
        getTotalLimit: async () => 20,
        getBlockUntil: async () => new Date(Date.now() + 5 * 60_000)
    }),
    async (req, res) => {
        // whatever you wanna do in this endpoint
    }
);
```

------

## Manual rate limiting

By using `rateLimiter.check()`

```js
io.on("connection", (socket) => {
    socket.on("message", (msg) => {
        const r = rateLimiter.check(`message/${socket.handshake.address}`,20);

        if (!r.ok) {
            socket.emit("error", "rate_limited");
            return;
        }

        handleMessage(msg);
    });
});
```

### With total check

```js
io.on("connection", (socket) => {
    socket.on("message", (msg) => {
        const rUser = rateLimiter.check(`message/${socket.handshake.address}`,20);
        const rTotal = rateLimiter.check(`message/total`,200);

        if (!rUser.ok || !rTotal.ok) {
            socket.emit("error", "rate_limited");
            return;
        }

        handleMessage(msg);
    });
});
```

------

## Consensus

A `calculateConsensus` function has been added to possibly set dynamic rate limits.

```js
// exmaple
const votes = [
    ["userA", 12, 1],
    ["userB", 13, 1],
    ["userC", 11, 1],
    ["userD", 48, 1], // spike
];

const { value, result, disqualified } = calculateConsensus(votes, 10);
```









