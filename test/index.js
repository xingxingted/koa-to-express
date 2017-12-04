/**
 *
 * @author gzwujiaxiang@corp.netease.com
 */

const fs        = require('fs');
const Path      = require('path');

const promisify = require('pify');
const express   = require('express');
const Agent     = require('supertest').agent;

const k2e       = require('..');

const app       = express();
app.use(k2e(function* () {
    const path  = this.path;

    if (path === '/json') {
        this.body    = {a: 1};
    }

    if (path === '/string') {
        this.body    = 'sth';
    }

    if (path === '/stream') {
        this.body    = fs.createReadStream(Path.join(__dirname, 'mocha.opts'), 'utf8');
    }

    if (path === '/buffer') {
        return this.body = yield promisify(fs.readFile)(Path.join(__dirname, 'mocha.opts'))
    }
}));

const agent     = Agent(app);

describe('Koa to Express middleware', () => {
    it('should response json', () => agent.get('/json').expect(200).then(res => res.body.should.be.deepEqual({a: 1})));

    it('should response a string', () => agent.get('/string').expect(200).then(res => res.text.should.be.equal('sth')));

    it('should response the file\'s content as a buffer', () => Promise.all([
        agent.get('/stream').expect(200),
        new Promise(resolve => fs.readFile(Path.join(__dirname, 'mocha.opts'), (err, content) => resolve(content)))
    ])
        .then(res => {
            const body = res[0].body;
            const content = res[1];
            Buffer.isBuffer(body).should.be.ok();
            body.compare(content).should.be.equal(0);
        }));

    it('should also response the file\'s buffer', () => Promise.all([
        agent.get('/buffer').expect(200),
        new Promise(resolve => fs.readFile(Path.join(__dirname, 'mocha.opts'), (err, content) => resolve(content)))
    ])
        .then(res => {
            const body = res[0].body;
            const content = res[1];
            Buffer.isBuffer(body).should.be.ok();
            body.compare(content).should.be.equal(0);
        }));

    it('should response 404', () => agent.get('/404').expect(404));
});