/**
 * koa-to-express
 * @author iswujixiang@gmail.com
 */

const Stream    = require('stream');

const Koa       = require('koa');
const compose   = require('koa-compose');
const debug     = require('debug')('koa-to-express:k2e');

const app       = new Koa;

module.exports = middlewares => {
    if (!Array.isArray(middlewares)) {
        middlewares = [middlewares];
    }

    const middleware = compose(middlewares);

    debug(`converted koa middlewares: ${middlewares.map(({name}) => name || '[anonymous]').join()}`);

    return (req, res, next) => {

        const ctx   = app.createContext(req, res);

        middleware(ctx)

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

                const {res, body} = ctx;
                if (null != body) {
                    if (body instanceof Stream) {
                        return body.pipe(res);
                    }

                    return res.send(body);
                }

                next();

            })

            .catch(next);
    };
};