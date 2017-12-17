/**
 * express-to-koa
 * @author iswujixiang@gmail.com
 */

const compose   = require('koa-compose');
const express   = require('express');
const {init}    = require('express/lib/middleware/init');
const debug     = require('debug')('koa-to-express:e2k');

const app       = express();

const e2k       = middlewares => {
    if (Array.isArray(middlewares)) {
        return compose(middlewares.map(e2k));
    }

    /* istanbul ignore if */
    if (middlewares.length === 4) {
        throw new Error('e2k do not support error-handler now');
    }

    debug(`converted express middleware: ${middlewares.name || '[anonymous]'}`);

    return (ctx, next) => {

        const {req, res, query} = ctx;

        if (!req.query) req.query = query; // express's query middleware

        if (req.res !== res) {
            init(app)(req, res, () => {
                // do nothing
            });
        }
        return new Promise((resolve, reject) => {
            try {
                if (!ctx.response._explicitStatus) {
                    res.status(200); //response OK, set status back to 200
                }
                res.on('finish', resolve);

                middlewares(req, res, err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve('next');
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

module.exports = e2k;
