"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 映画作品コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../../common/Const/Message");
const debug = createDebug('chevre-backend:*');
// 1ページに表示するデータ数
// const DEFAULT_LINES: number = 10;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 作品名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES = 10;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'add');
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const movie = createMovieFromBody(req.body);
                    debug('saving an movie...', movie);
                    const creativeWorkService = new chevre.service.CreativeWork({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    yield creativeWorkService.createMovie(movie);
                    res.redirect(`/creativeWorks/movie/${movie.identifier}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = req.body;
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('creativeWorks/movie/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        let movie = yield creativeWorkService.findMovieByIdentifier({
            identifier: req.params.identifier
        });
        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'update');
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    movie = createMovieFromBody(req.body);
                    debug('saving an movie...', movie);
                    yield creativeWorkService.createMovie(movie);
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            identifier: (_.isEmpty(req.body.identifier)) ? movie.identifier : req.body.identifier,
            name: (_.isEmpty(req.body.nameJa)) ? movie.name : req.body.name,
            duration: (_.isEmpty(req.body.duration)) ? moment.duration(movie.duration).asMinutes() : req.body.duration,
            contentRating: movie.contentRating
        };
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('creativeWorks/movie/edit', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.update = update;
function createMovieFromBody(body) {
    return {
        typeOf: chevre.factory.creativeWorkType.Movie,
        identifier: body.identifier,
        name: body.name,
        duration: moment.duration(Number(body.duration), 'm').toISOString(),
        contentRating: body.contentRating
    };
}
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // const limit: number = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
        // const page: number = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
        // const identifier: string = (!_.isEmpty(req.query.identifier)) ? req.query.identifier : null;
        // const name: string = (!_.isEmpty(req.query.name)) ? req.query.name : null;
        // const conditions: any = {
        //     typeOf: chevre.factory.creativeWorkType.Movie
        // };
        // if (identifier !== null) {
        //     conditions.identifier = identifier;
        // }
        // if (name !== null) {
        //     conditions.name = { $regex: `^${name}` };
        // }
        try {
            const creativeWorkService = new chevre.service.CreativeWork({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const movies = yield creativeWorkService.searchMovies({});
            // const numDocs = await creativeWorkRepo.creativeWorkModel.count(conditions).exec();
            // let results: any[] = [];
            // if (numDocs > 0) {
            //     const docs = await creativeWorkRepo.creativeWorkModel.find(conditions).skip(limit * (page - 1)).limit(limit).exec();
            //     results = docs.map((doc) => doc.toObject());
            // }
            res.json({
                success: true,
                count: movies.length,
                results: movies
            });
        }
        catch (error) {
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    });
}
exports.getList = getList;
/**
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.render('creativeWorks/movie/index', {
            filmModel: {}
        });
    });
}
exports.index = index;
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req, checkType) {
    let colName = '';
    // 作品コード
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名
    colName = '作品名';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 上映時間
    colName = '上映時間';
    req.checkBody('duration', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_MINUTES))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // レイティング
    colName = 'レイティング';
    req.checkBody('contentRating', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
