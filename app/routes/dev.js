"use strict";
/**
 * devルーター
 *
 * @ignore
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const devRouter = express.Router();
const createDebug = require("debug");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const mongooseConnectionOptions_1 = require("../../mongooseConnectionOptions");
const debug = createDebug('chevre-backend:devRouters:dev');
devRouter.get('/400', () => {
    throw new Error('400 manually');
});
devRouter.get('/environmentVariables', (__, res) => {
    res.json({
        data: {
            type: 'envs',
            attributes: process.env
        }
    });
});
devRouter.get('/mongoose/connect', (__, res, next) => {
    debug('connecting...');
    mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default, (err) => {
        if (err instanceof Error) {
            next(err);
            return;
        }
        res.status(http_status_1.NO_CONTENT).end();
    });
});
devRouter.get('/mongoose/disconnect', (__, res, next) => {
    debug('disconnecting...');
    mongoose.disconnect((err) => {
        if (err instanceof Error) {
            next(err);
            return;
        }
        res.status(http_status_1.NO_CONTENT).end();
    });
});
exports.default = devRouter;
