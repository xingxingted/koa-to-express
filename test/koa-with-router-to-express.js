const express = require('express');
const Koa = require('koa');
const {agent} = require('supertest');

const Router = require('@koa/router');

const k2e = require('..');

const expressApp = express();
const koaApp = new Koa();
const router = new Router();

router.get('/health', function (ctx, next) {
    ctx.body = {
        everything: 'is ok',
    }
})

koaApp.use(router.routes()).use(router.allowedMethods());

koaApp.use(async (ctx, next) => {
    ctx.body = 'all paths are not matched!'
})

expressApp.use('/error', (req, res, next) => {
    res.status(502);
    next();
});
koaApp.middleware.forEach(middleware => expressApp.use(k2e(middleware)));

const expressAgent = agent(expressApp);
const koaAgent = agent(koaApp.callback());

describe('Koa with router to Express', () => {
    it('should response health when requesting /health', () => Promise.all([
        expressAgent.get('/health').expect(200),
        koaAgent.get('/health').expect(200)
    ]).then(([{body: expressBody}, {body: koaBody}]) => expressBody.should.be.deepEqual(koaBody)));

    // This test case is to reproduce an issue when working with @koa/router
    it('should response not exists when no matching path found', () => Promise.all([
        // Before Fix, the test case will be Error: expected 200 "OK", got 500 "Internal Server Error"
        expressAgent.get('/not-exist').expect(200),
        koaAgent.get('/not-exist').expect(200)
    ]).then(([{body: expressBody}, {body: koaBody}]) => expressBody.should.be.deepEqual(koaBody)));
});