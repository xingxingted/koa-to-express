/**
 * main
 * @author iswujixiang@gmail.com
 */

const k2e       = require('./lib/koa-to-express');

const e2k       = require('./lib/express-to-koa');

k2e.koaToExpress = k2e;
k2e.expressToKoa = e2k;

module.exports  = k2e;