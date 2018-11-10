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
 * 勘定科目コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const _ = require("underscore");
const Message = require("../common/Const/Message");
const debug = createDebug('chevre-backend:controllers');
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitle = createFromBody(req.body);
                    debug('saving account title...', accountTitle);
                    const accountTitleService = new chevre.service.AccountTitle({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    yield accountTitleService.create(accountTitle);
                    res.redirect(`/accountTitles/${accountTitle.identifier}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        console.error(errors);
        const forms = Object.assign({ category: {
                category: {}
            } }, req.body);
        // 作品マスタ画面遷移
        res.render('accountTitles/add', {
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
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        let accountTitle = yield accountTitleService.findByIdentifier({
            identifier: req.params.identifier
        });
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    accountTitle = createFromBody(req.body);
                    debug('saving account title...', accountTitle);
                    yield accountTitleService.update(accountTitle);
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({ identifier: (_.isEmpty(req.body.identifier)) ? accountTitle.identifier : req.body.identifier, name: (_.isEmpty(req.body.name)) ? accountTitle.name : req.body.name, category: {
                category: {}
            } }, {
            category: (_.isEmpty(req.body.category))
                ? (accountTitle.category !== undefined)
                    ? Object.assign({ category: {} }, accountTitle.category) : {
                    category: {}
                }
                : req.body.category
        });
        // 作品マスタ画面遷移
        res.render('accountTitles/edit', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.update = update;
function createFromBody(body) {
    return {
        typeOf: 'AccountTitle',
        identifier: body.identifier,
        name: body.name,
        description: body.description,
        category: body.category
    };
}
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accountTitleService = new chevre.service.AccountTitle({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const result = yield accountTitleService.search({
                limit: req.query.limit,
                page: req.query.page,
                identifier: (req.query.identifier !== undefined && req.query.identifier !== '') ? req.query.identifier : undefined
            });
            res.json({
                success: true,
                count: result.totalCount,
                results: result.data
            });
        }
        catch (error) {
            console.error(error);
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
        res.render('accountTitles/index', {
            forms: {}
        });
    });
}
exports.index = index;
/**
 * 科目新規登録画面検証
 */
function validate(req) {
    // 科目分類コード
    let colName = '科目分類コード';
    req.checkBody('category.category.identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('category.category.identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目分類名称
    colName = '科目分類名称';
    req.checkBody('category.category.name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('category.category.name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 科目コード
    colName = '科目コード';
    req.checkBody('category.identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('category.identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目名称
    colName = '科目名称';
    req.checkBody('category.name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('category.name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 細目コード
    colName = '細目コード';
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 細目名称
    colName = '細目名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
