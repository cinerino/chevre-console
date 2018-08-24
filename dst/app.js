"use strict";
/**
 * expressアプリケーション
 */
const chevre = require("@chevre/domain");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
// tslint:disable-next-line:no-require-imports
const expressValidator = require("express-validator");
const helmet = require("helmet");
const multer = require("multer");
const favicon = require("serve-favicon");
// tslint:disable-next-line:no-var-requires no-require-imports
const expressLayouts = require('express-ejs-layouts');
const mongooseConnectionOptions_1 = require("./mongooseConnectionOptions");
// ミドルウェア
const errorHandler_1 = require("./middlewares/errorHandler");
const locals_1 = require("./middlewares/locals");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const session_1 = require("./middlewares/session");
// ルーター
const router_1 = require("./routes/router");
const app = express();
app.use(cors()); // enable All CORS Requests
app.use(helmet());
app.use(session_1.default); // セッション
app.use(locals_1.default); // テンプレート変数
// view engine setup
app.set('views', `${__dirname}/../views`);
app.set('view engine', 'ejs');
app.use(expressLayouts);
// app.set('layout extractScripts', true);
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
chevre.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default).catch(console.error);
app.use(router_1.default);
// 404
app.use(notFoundHandler_1.default);
// error handlers
app.use(errorHandler_1.default);
module.exports = app;
