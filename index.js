/**
 * main
 * @author iswujixiang@gmail.com
 */

const Stream    = require('stream');

const Koa       = require('koa');
const compose   = require('koa-compose');
const express   = require('express');
const {init}    = require('express/lib/middleware/init');
const debug     = require('debug')('koa-to-express');

const app       = new Koa;

const k2e       = middlewares => {
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

const expressApp = express();
const {request, reponse} = expressApp;

const e2k       = middlewares => {
    if (Array.isArray(middlewares)) {
        return compose(middlewares.map(e2k));
    }

    if (middlewares.length === 4) {
        throw new Error('e2k do not support error-handler now');
    }

    debug(`converted express middleware: ${middlewares.name || '[anonymous]'}`);

    return (ctx, next) => {

        const {req, res, query} = ctx;

        if (!req.query) req.query = query; // express's query middleware

        if (!(req.__proto__ === request && res.__proto__ === reponse)) {
            init(expressApp)(req, res, function () {
                // do nothing
            });
        }
        return new Promise((resolve, reject) => {
            try {
                res
                    .status(200)
                    .on('finish', resolve);
                middlewares(req, res, err => {
                    if (!err) {
                        return resolve('next');
                    }
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        }).then(_next => {
            if (_next) {
                res.status(404);
                return next();
            }
        });
    };
};

module.exports  = k2e;
module.exports.expressToKoa = e2k;