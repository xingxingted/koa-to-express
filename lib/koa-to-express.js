/**
 * koa-to-express
 * @author iswujixiang@gmail.com
 */

const Stream    = require('stream');
const {STATUS_CODES} = require('http');

const Koa       = require('koa');
const compose   = require('koa-compose');
const debug     = require('debug')('koa-to-express:k2e');

const app       = new Koa;

module.exports = middlewares => {
    const isArray = Array.isArray(middlewares);
    const middleware = isArray ? compose(middlewares) : middlewares;

    debug(`converted koa middlewares: ${isArray ? middlewares.map(({name}) => name || '[anonymous]').join() : (middlewares.name || /* istanbul ignore next */ '[anonymous]')}`);

    return (req, res, next) => {

        const ctx   = app.createContext(req, res);
        ctx.matched = [];

        if (ctx.status === 200) {
            res.statusCode = 404;
        }

        middleware(ctx, () => {
            return Promise.resolve(); //do nothing)
        })

            .then(() => {
                // allow bypassing koa
                /* istanbul ignore if */
                if (ctx.respond === false) {
                    return next();
                }

                /* istanbul ignore if */
                if (!ctx.writable) {
                    return next();
                }

                const {res, body, status} = ctx;
                if (null != body) {
                    if (body instanceof Stream) {
                        return body.pipe(res);
                    }

                    return res.send(body);
                }

                // status body
                if (status !== 404) {
                    const body = ctx.message || /* istanbul ignore next */ String(status);
                    /* istanbul ignore else */
                    if (!res.headersSent) {
                        ctx.type = 'text';
                        ctx.length = Buffer.byteLength(body);
                    }
                    return res.send(body);
                }

                res.status(200);

                next();

            })

            .catch(err => {
                if (!(err instanceof Error)) {
                    err = new Error(`non-error thrown: ${err}`);
                }
                if ('ENOENT' === err.code) {
                    err.status = 404;
                }
                if ('number' !== typeof err.status || !STATUS_CODES[err.status]) {
                    err.status = 500;
                }
                next(err);
            });
    };
};