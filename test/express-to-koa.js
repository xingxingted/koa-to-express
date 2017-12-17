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

const expressToKoa = require('..').expressToKoa;

const expressApp = express();
const koaApp    = new Koa;

const middleware = (req, res, next) => {
    if (req.path === '/json') {
        return res.send({a: 1});
    }

    return next();
};

const middlewares = [
    (req, res, next) => {
        if (req.path === '/string') {
            return res.send('sth');
        }

        return next();
    },
    (req, res, next) => {
        if (req.path === '/stream') {
            return res.sendfile(Path.join(__dirname, 'mocha.opts'));
        }

        return next();
    },
    (req, res, next) => {
        if (req.path === '/buffer') {
            return promisify(fs.readFile)(Path.join(__dirname, 'mocha.opts'))
                .then(buffer => res.send(buffer))
                .catch(next);
        }

        return next();
    },
    (req, res, next) => {
        if (req.path === '/500') {
            res.status(500);
        }

        return next();
    },
    (req, res, next) => {
        if (req.path === '/throw') {
            throw new Error();
        }

        return next();
    },
    (req, res, next) => {
        if (req.path === '/error') {
            return next(new Error())
        }

        return next();
    }
];

koaApp.use(expressToKoa(middleware));
koaApp.use(function *(next) {
    if (this.path === '/error') {
        this.status = 502;
    }

    yield next;
});
koaApp.use(expressToKoa(middlewares));

expressApp.use(middleware);
middlewares.forEach(middleware => expressApp.use(middleware));

const expressAgent = agent(expressApp);
const koaAgent = agent(koaApp.callback());

describe('Express to Koa middleware', () => {
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

    it('should response 500 when pass an error to the next', () => Promise.all([
        expressAgent.get('/error').expect(500),
        koaAgent.get('/error').expect(500)
    ]));

    it('should response 500 and throw an error when requesting /throw', () => Promise.all([
        expressAgent.get('/throw').expect(500),
        koaAgent.get('/throw').expect(500)
    ]));

    it('should response 404', () => expressAgent.get('/404').expect(404));
});