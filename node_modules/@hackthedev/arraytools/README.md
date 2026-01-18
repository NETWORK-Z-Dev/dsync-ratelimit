# ArrayTools

As the name suggests its a small helpful library with a few helper functions to modify arrays and adding a match function that supports regex. Its really nothing all to special.

Here's a small example

```js
const whitelist = new ArrayTools(); // or new Whitelist(your_array);

whitelist.addEntry("/login");
whitelist.addEntry("/health");
whitelist.addEntry(/^\/api\/public\/.+$/);
whitelist.addEntry("/^\/static\//");

whitelist.matches("/login");             // true
whitelist.matches("/api/public/test");   // true
whitelist.matches("/api/private/test");  // false		
```

