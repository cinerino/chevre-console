"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * インデックスコントローラー
 */
const createDebug = require("debug");
const http_status_1 = require("http-status");
const debug = createDebug('chevre-backend:*');
function index(req, res, next) {
    debug('query:', req.query);
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));
        return;
    }
    res.redirect(http_status_1.TEMPORARY_REDIRECT, '/master/creativeWorks/movie');
}
exports.index = index;
