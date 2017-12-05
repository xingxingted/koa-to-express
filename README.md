# koa-to-express

[![Build Status](https://travis-ci.org/xingxingted/koa-to-express.svg?branch=2.x)](https://travis-ci.org/xingxingted/koa-to-express)
[![codecov](https://codecov.io/gh/xingxingted/koa-to-express/branch/2.x/graph/badge.svg)](https://codecov.io/gh/xingxingted/koa-to-express)
[![npm version](https://badge.fury.io/js/koa-to-express.svg)](https://badge.fury.io/js/koa-to-express)

Use a **koa** middleware in **express/connect** backward

## Requirement
Koa-to-express requires *koa@2.0.0* and *express@3.0.0* or higher.

Node 7.6+ is required if you want to use ES2015's *async/await* syntax.

## Installation

```
npm install koa-to-express
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

## License

MIT