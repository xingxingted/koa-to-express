# koa-to-express

[![Build Status](https://travis-ci.org/xingxingted/koa-to-express.svg?branch=0.x)](https://travis-ci.org/xingxingted/koa-to-express)
[![codecov](https://codecov.io/gh/xingxingted/koa-to-express/branch/0.x/graph/badge.svg)](https://codecov.io/gh/xingxingted/koa-to-express)
[![npm version](https://badge.fury.io/js/koa-to-express.svg)](https://badge.fury.io/js/koa-to-express)

Use a **koa** middleware in **express/connect** backward

## Requirement
Koa-to-express requires *koa@1.0.0* and *express@4.0.0* or higher.

## Installation

```
npm install koa-to-express
```

## Usage

```
const k2e       = require('koa-to-express');

const koaMiddleware = function* (next) {
    this.body = 'hello world';
    yield next;
};

require('express')().use(k2e(koaMiddleware)).listen(3000);

// curl localhost:3000/
// output: hello world
```

## License

MIT