/**
 * main
 * @author iswujixiang@gmail.com
 */

const Stream    = require('stream');

const Koa       = require('koa');
const compose   = require('koa-compose');

const app       = new Koa;

module.exports  = (middleware) => (req, res, next) => {

    let ctx     = app.createContext(req, res);

    if (!Array.isArray(middleware)) {
        middleware = [middleware];
    }

    compose(middleware)(ctx)

        .then(() => {
            // allow bypassing koa
            /* istanbul ignore if */
            if (false === ctx.respond) return next();

            const res = ctx.res;
            /* istanbul ignore if */
            if (!ctx.writable) return next();

            let body = ctx.body;
            if (null != body) {
                if (Buffer.isBuffer(body)) return res.send(body);
                if ('string' == typeof body) return res.send(body);
                if (body instanceof Stream) return body.pipe(res);

                // body: json
                return res.json(body);
            }

            next();

        })

        .catch(next);
};
