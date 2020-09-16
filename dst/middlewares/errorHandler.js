"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = require("http-status");
exports.default = (err, _, res, next) => {
    if (res.headersSent) {
        next(err);
        return;
    }
    // エラーオブジェクトの場合は、キャッチされた例外でクライント依存のエラーの可能性が高い
    if (err instanceof Error) {
        res.status(http_status_1.BAD_REQUEST)
            .render('error/badRequest', {
            message: err.message,
            layout: 'layouts/error'
        });
    }
    else {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .render('error/internalServerError', {
            message: 'an unexpected error occurred',
            layout: 'layouts/error'
        });
    }
};
