/**
 * express-to-koa
 * @author iswujixiang@gmail.com
 */

const compose   = require('koa-compose');
const express   = require('express');
const {init}    = require('express/lib/middleware/init');
const debug     = require('debug')('koa-to-express:e2k');

const app       = express();
const {request, reponse} = app;

module.exports  = middlewares => {
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
            init(app)(req, res, function () {
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
