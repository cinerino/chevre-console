"use strict";
/**
 * expressアプリケーション
 *
 * @ignore
 */
// 依存パッケージ
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const createDebug = require("debug");
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const multer = require("multer");
const favicon = require("serve-favicon");
// tslint:disable-next-line:no-require-imports
const expressValidator = require("express-validator");
// tslint:disable-next-line:no-var-requires no-require-imports
const expressLayouts = require('express-ejs-layouts');
const mongooseConnectionOptions_1 = require("../mongooseConnectionOptions");
// ミドルウェア
const basicAuth_1 = require("./middlewares/basicAuth");
const benchmarks_1 = require("./middlewares/benchmarks");
const errorHandler_1 = require("./middlewares/errorHandler");
const locals_1 = require("./middlewares/locals");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const session_1 = require("./middlewares/session");
const userAuthentication_1 = require("./middlewares/userAuthentication");
// ルーター
const dev_1 = require("./routes/dev");
const auth_1 = require("./routes/master/auth");
const film_1 = require("./routes/master/film");
const performance_1 = require("./routes/master/performance");
const report_1 = require("./routes/master/report");
const ticketType_1 = require("./routes/master/ticketType");
const ticketTypeGroup_1 = require("./routes/master/ticketTypeGroup");
const router_1 = require("./routes/router");
const debug = createDebug('chevre-backend:app');
const app = express();
app.use(basicAuth_1.default); // ベーシック認証
app.use(cors()); // enable All CORS Requests
app.use(helmet());
app.use(benchmarks_1.default); // ベンチマーク的な
app.use(session_1.default); // セッション
app.use(locals_1.default); // テンプレート変数
if (process.env.NODE_ENV !== 'production') {
    // サーバーエラーテスト
    app.get('/dev/uncaughtexception', (req) => {
        req.on('data', (chunk) => {
            debug(chunk);
        });
        req.on('end', () => {
            throw new Error('uncaughtexception manually');
        });
    });
}
// view engine setup
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(expressLayouts);
// tslint:disable-next-line:no-backbone-get-set-outside-model
app.set('layout', 'layouts/layout');
// uncomment after placing your favicon in /public
app.use(favicon(`${__dirname}/../public/favicon.ico`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// for parsing multipart/form-data
const storage = multer.memoryStorage();
app.use(multer({ storage: storage }).any());
app.use(cookieParser());
app.use(express.static(`${__dirname}/../public`));
app.use(expressValidator()); // バリデーション
// Use native promises
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default);
// ルーティング登録の順序に注意！
if (process.env.NODE_ENV !== 'production') {
    app.use('/dev', dev_1.default);
}
app.use(auth_1.default); // ログイン・ログアウト
app.use(userAuthentication_1.default); // ユーザー認証
app.use(router_1.default);
app.use('/master/films', film_1.default); //作品
app.use('/master/performances', performance_1.default); //パフォーマンス
app.use('/master/ticketTypes', ticketType_1.default); //券種
app.use('/master/ticketTypeGroups', ticketTypeGroup_1.default); //券種グループ
app.use('/master/report', report_1.default); //レポート出力
// 404
app.use(notFoundHandler_1.default);
// error handlers
app.use(errorHandler_1.default);
module.exports = app;
