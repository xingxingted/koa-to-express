/**
 *
 * @author gzwujiaxiang@corp.netease.com
 */

const fs        = require('fs');
const Path      = require('path');

const express   = require('express');
const Agent     = require('supertest').agent;

const k2e       = require('..');

const app       = express();
app.use(k2e(async (ctx) => {
    let {path}  = ctx;

    if (path === '/json') {
        ctx.body    = {a: 1};
    }

    if (path === '/string') {
        ctx.body    = 'sth';
    }

    if (path === '/stream') {
        ctx.body    = fs.createReadStream(Path.join(__dirname, 'mocha.opts'), 'utf8');
    }

    if (path === '/buffer') {
        ctx.body    = await new Promise(resolve => fs.readFile(Path.join(__dirname, 'mocha.opts'), (err, content) => resolve(content)));
    }
}));

const agent     = Agent(app);

describe('Koa to Express middleware', () => {
    it('should response a json', () => agent.get('/json').expect(200).then(({body}) => body.should.be.deepEqual({a: 1})));

    it('should response a string', () => agent.get('/string').expect(200).then(({text}) => text.should.be.equal('sth')));

    it('should response the file\'s content as a buffer', () => Promise.all([
        agent.get('/stream').expect(200),
        new Promise(resolve => fs.readFile(Path.join(__dirname, 'mocha.opts'), (err, content) => resolve(content)))
    ])
        .then(([{body}, content]) => {
            Buffer.isBuffer(body).should.be.ok();
            body.compare(content).should.be.equal(0);
        }));

    it('should also response the file\'s buffer', () => Promise.all([
        agent.get('/buffer').expect(200),
        new Promise(resolve => fs.readFile(Path.join(__dirname, 'mocha.opts'), (err, content) => resolve(content)))
    ])
        .then(([{body}, content]) => {
            Buffer.isBuffer(body).should.be.ok();
            body.compare(content).should.be.equal(0);
        }));

    it('should response 404', () => agent.get('/404').expect(404));
});