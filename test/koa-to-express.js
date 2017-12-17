/**
 *
 * @author gzwujiaxiang@corp.netease.com
 */

const fs        = require('fs');
const Path      = require('path');

const promisify = require('pify');
const express   = require('express');
const Koa       = require('koa');
const agent     = require('supertest').agent;

const k2e       = require('..');

const expressApp = express();
const koaApp    = new Koa;

const middleware = function *(next) {
    if (this.path === '/json') {
        return this.body    = {a: 1};
    }

    yield next;
};

const middlewares = [
    function *(next) {
        if (this.path === '/string') {
            return this.body = 'sth';
        }

        yield next;
    },
    function *(next) {
        if (this.path === '/stream') {
            return this.body = fs.createReadStream(Path.join(__dirname, 'mocha.opts'), 'utf8');
        }

        yield next;
    },
    function *(next) {
        if (this.path === '/buffer') {
            return this.body = yield promisify(fs.readFile)(Path.join(__dirname, 'mocha.opts'));
        }

        yield next;
    },
    function *(next) {
        if (this.path === '/reject') {
            return yield Promise.reject('hehe');
        }

        yield next;
    },
    function *(next) {
        if (this.path === '/error') {
            this.status = 500;
        }

        yield next;
    },
    function *(next) {
        if (this.path === '/throw') {
            this.throw(401, 'denied');
        }

        yield next;
    },
    function *(next) {
        if (this.path === '/ENOENT') {
            const err = new Error();
            err.code = 'ENOENT';
            throw err;
        }

        yield next;
    }
];

expressApp.use(k2e(middleware));
expressApp.use('/error', (req, res, next) => {
    res.status(502);
    next();
});
expressApp.use(k2e(middlewares));

koaApp.use(middleware);
middlewares.forEach(middleware => koaApp.use(middleware));

const expressAgent = agent(expressApp);
const koaAgent = agent(koaApp.callback());

describe('Koa to Express middleware', () => {
    it('should response json when requesting /json', () => Promise.all([
        expressAgent.get('/json').expect(200),
        koaAgent.get('/json').expect(200)
    ]).then(result => result[0].body.should.be.deepEqual(result[1].body)));

    it('should response a string when requesting /string', () => Promise.all([
        expressAgent.get('/string').expect(200),
        koaAgent.get('/string').expect(200)
    ]).then(result => result[0].text.should.be.equal(result[1].text)));

    it('should response the file\'s content as a buffer when requesting /stream', () => Promise.all([
        expressAgent.get('/stream').expect(200),
        koaAgent.get('/stream').expect(200)
    ])
        .then(result => {
            Buffer.isBuffer(result[0].body).should.be.ok();
            result[0].body.compare(result[1].body).should.be.equal(0);
        }));

    it('should also response the file\'s buffer when requesting /stream', () => Promise.all([
        expressAgent.get('/buffer').expect(200),
        koaAgent.get('/buffer').expect(200)
    ])
        .then(result => {
            Buffer.isBuffer(result[0].body).should.be.ok();
            result[0].body.compare(result[1].body).should.be.equal(0);
        }));

    it('should response 500 when requesting /error', () => Promise.all([
        expressAgent.get('/error').expect(500),
        koaAgent.get('/error').expect(500)
    ]).then(result => result[0].text.should.be.equal(result[1].text)));

    it('should response 500 and throw an error when requesting /reject', () => Promise.all([
        expressAgent.get('/reject').expect(500),
        koaAgent.get('/reject').expect(500)
    ]));

    it('should response 401 and throw an error when requesting /throw', () => Promise.all([
        expressAgent.get('/throw').expect(401),
        koaAgent.get('/throw').expect(401)
    ]));

    it('should response 404 and throw an error when requesting /ENOENT', () => Promise.all([
        expressAgent.get('/ENOENT').expect(404),
        koaAgent.get('/ENOENT').expect(404)
    ]));

    it('should response 404 when requesting /404', () => expressAgent.get('/404').expect(404));
});