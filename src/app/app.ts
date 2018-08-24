/**
 * expressアプリケーション
 */
import * as chevre from '@chevre/domain';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as createDebug from 'debug';
import * as express from 'express';
// tslint:disable-next-line:no-require-imports
import expressValidator = require('express-validator');
import * as helmet from 'helmet';
import * as multer from 'multer';
import * as favicon from 'serve-favicon';
// tslint:disable-next-line:no-var-requires no-require-imports
const expressLayouts = require('express-ejs-layouts');

import mongooseConnectionOptions from '../mongooseConnectionOptions';

// ミドルウェア
import basicAuth from './middlewares/basicAuth';
import benchmarks from './middlewares/benchmarks';
import errorHandler from './middlewares/errorHandler';
import locals from './middlewares/locals';
import notFoundHandler from './middlewares/notFoundHandler';
import session from './middlewares/session';

// ルーター
import router from './routes/router';

const debug = createDebug('chevre-backend:*');

const app = express();

app.use(basicAuth); // ベーシック認証
app.use(cors()); // enable All CORS Requests
app.use(helmet());
app.use(benchmarks); // ベンチマーク的な
app.use(session); // セッション
app.use(locals); // テンプレート変数

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
app.set('views', `${__dirname}/../../views`);
app.set('view engine', 'ejs');
app.use(expressLayouts);
// app.set('layout extractScripts', true);
// tslint:disable-next-line:no-backbone-get-set-outside-model
app.set('layout', 'layouts/layout');

// uncomment after placing your favicon in /public
app.use(favicon(`${__dirname}/../../public/favicon.ico`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// for parsing multipart/form-data
const storage = multer.memoryStorage();
app.use(multer({ storage: storage }).any());

app.use(cookieParser());
app.use(express.static(`${__dirname}/../../public`));

app.use(expressValidator()); // バリデーション

// Use native promises
chevre.mongoose.Promise = global.Promise;
chevre.mongoose.connect(<string>process.env.MONGOLAB_URI, mongooseConnectionOptions).catch(console.error);

app.use(router);

// 404
app.use(notFoundHandler);

// error handlers
app.use(errorHandler);

export = app;
