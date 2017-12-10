/**
 *
 * @author gzwujiaxiang@corp.netease.com
 */

const fs        = require('fs');
const Path      = require('path');

const promisify = require('pify');
const Koa       = require('koa');
const {agent: Agent} = require('supertest');

const {expressToKoa} = require('..');

const app       = new Koa;
app.use(expressToKoa((req, res, next) => {
    const {path}  = req;

    if (path === '/json') {
        return res.send({a: 1});
    }

    if (path === '/string') {
        return res.send('sth');
    }

    if (path === '/stream') {
        return fs.createReadStream(Path.join(__dirname, 'mocha.opts'), 'utf8')
            .on('error', next)
            .pipe(res.on('error', next));
    }

    if (path === '/buffer') {
        return promisify(fs.readFile)(Path.join(__dirname, 'mocha.opts'))
            .then(buffer => res.send(buffer))
            .catch(next);
    }

    next();
}));

const agent     = Agent(app.callback());

describe('Koa to Express middleware', () => {
    it('should response json', () => agent.get('/json').expect(200).then(({body}) => body.should.be.deepEqual({a: 1})));

    it('should response a string', () => agent.get('/string').expect(200).then(({text}) => text.should.be.equal('sth')));

    it('should response the file\'s content as a buffer', () => Promise.all([
        agent.get('/stream').expect(200),
        promisify(fs.readFile)(Path.join(__dirname, 'mocha.opts'), 'utf8')
    ])
        .then(([{text}, content]) => {
            text.should.be.equal(content);
        }));

    it('should also response the file\'s buffer', () => Promise.all([
        agent.get('/buffer').expect(200),
        promisify(fs.readFile)(Path.join(__dirname, 'mocha.opts'))
    ])
        .then(([{body}, content]) => {
            Buffer.isBuffer(body).should.be.ok();
            body.compare(content).should.be.equal(0);
        }));

    it('should response 404', () => agent.get('/404').expect(404));
});