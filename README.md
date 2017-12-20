# koa-to-express

[![Build Status](https://travis-ci.org/xingxingted/koa-to-express.svg?branch=master)](https://travis-ci.org/xingxingted/koa-to-express)
[![codecov](https://codecov.io/gh/xingxingted/koa-to-express/branch/master/graph/badge.svg)](https://codecov.io/gh/xingxingted/koa-to-express)
[![npm version](https://badge.fury.io/js/koa-to-express.svg)](https://badge.fury.io/js/koa-to-express)

Use a **Koa/Express** middleware in an Express/Koa app.

It could convert a middleware to another form between Express and koa middleware.

## Requirement
Koa-to-express requires *koa@2.0.0* and *express@4.0.0* or higher.

Node 7.6+ is required if you want to use ES2015's *async/await* syntax.

Please go to [koa-to-express@1.x](https://github.com/xingxingted/koa-to-express/tree/1.x) if you want to use koa1.

## Installation
Npm 5.x
```
npm install koa-to-express [-P]
```

Others
```
npm install koa-to-express -S
```

## Usage

```
const k2e       = require('koa-to-express');

const koaMiddleware = (ctx, next) => {
    ctx.body = 'hello world';
    return next();
};

require('express')().use(k2e(koaMiddleware)).listen(3000);

// curl localhost:3000/
// output: hello world
```

## API

### koaToExpress[.koaToExpress]\(middleware)

- **middleware** : `Function|Array<Function>`

****

* Convert Koa middleware(s) into an Express middleware and return it.

* Note that the second parameter (usually named as "next") passed to the last one of the middlewares is `() => Promise.resolve()`, because the cascading categories between [Koa](https://github.com/koajs/koa/blob/master/docs/api/index.md#cascading) and [Express](http://expressjs.com/en/guide/writing-middleware.html) are different and the end of the rest Express middlewares executing can't be informed back.

* It means that, resolving or rejecting the Koa middleware(s), which will return a resolved or rejected promise, will call the next middleware (as calling the Express's `next()`) or throw out an error (as calling the `next(err)`).

### koaToExpress.expressToKoa(middleware)

- **middleware** : `Function|Array<Function>`

****

* Convert Express middleware(s) into a Koa middleware and return it.

## License

MIT
