/**
 * main
 * @author iswujixiang@gmail.com
 */

const Stream    = require('stream');

const Koa       = require('koa');
const compose   = require('koa-compose');
const co        = require('co');
const debug     = require('debug')('koa-to-express');

const app       = new Koa;

const k2e       = middlewares => {
    /* istanbul ignore else */
    if (!Array.isArray(middlewares)) {
        middlewares = [middlewares];
    }

    const middleware = compose(middlewares);

    debug(`converted middlewares: ${middlewares.map(middleware => middleware.name || '[anonymous]').join()}`);

    return (req, res, next) => {

        const ctx   = app.createContext(req, res);

        co.wrap(middleware).call(ctx)

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

                const res = ctx.res;
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
};

module.exports  = k2e;