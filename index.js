/**
 * main
 * @author iswujixiang@gmail.com
 */

const Stream    = require('stream');

const Koa       = require('koa');
const compose   = require('koa-compose');
const co        = require('co');

const app       = new Koa;

module.exports  = middlewares => (req, res, next) => {

    const ctx   = app.createContext(req, res);

    if (!Array.isArray(middlewares)) {
        middlewares = [middlewares];
    }

    co.wrap(compose(middlewares)).call(ctx)

        .then(() => {
            // allow bypassing koa
            /* istanbul ignore if */
            if (ctx.respond === false) {
                return next();
            }

            const res = ctx.res;
            /* istanbul ignore if */
            if (!ctx.writable) {
                return next();
            }

            const body = ctx.body;
            if (null != body) {
                if (Buffer.isBuffer(body)) {
                    return res.send(body);
                }
                if (typeof body === 'string') {
                    return res.send(body);
                }
                if (body instanceof Stream) {
                    return body.pipe(res);
                }

                // body: json
                return res.json(body);
            }

            next();

        })

        .catch(next);
};
