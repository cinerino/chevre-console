"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 科目分類コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const Message = require("../../message");
const debug = createDebug('chevre-backend:controllers');
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
/**
 * 科目分類作成
 */
function create(req, res) {
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
                    const accountTitle = {
                        project: req.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.codeValue,
                        name: req.body.name,
                        description: req.body.description,
                        hasCategoryCode: []
                    };
                    debug('saving account title...', accountTitle);
                    const accountTitleService = new chevre.service.AccountTitle({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    yield accountTitleService.createAccounTitleCategory(accountTitle);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles/accountTitleCategory/${accountTitle.codeValue}`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({}, req.body);
        res.render('accountTitles/accountTitleCategory/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.create = create;
/**
 * 科目分類検索
 */
function search(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        if (req.xhr) {
            try {
                debug('searching accountTitleCategories...', req.query);
                const limit = Number(req.query.limit);
                const page = Number(req.query.page);
                const { data } = yield accountTitleService.searchAccountTitleCategories({
                    limit: limit,
                    page: page,
                    project: { ids: [req.project.id] },
                    codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '') ? `${req.query.codeValue}` : undefined
                });
                res.json({
                    success: true,
                    count: (data.length === Number(limit))
                        ? (Number(page) * Number(limit)) + 1
                        : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                    results: data
                });
            }
            catch (error) {
                res.json({
                    success: false,
                    count: 0,
                    results: []
                });
            }
        }
        else {
            res.render('accountTitles/accountTitleCategory/index', {
                forms: {}
            });
        }
    });
}
exports.search = search;
/**
 * 科目分類編集
 */
function update(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let message = '';
            let errors = {};
            const accountTitleService = new chevre.service.AccountTitle({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchAccountTitlesResult = yield accountTitleService.searchAccountTitleCategories({
                project: { ids: [req.project.id] },
                codeValue: { $eq: req.params.codeValue }
            });
            let accountTitle = searchAccountTitlesResult.data.shift();
            if (accountTitle === undefined) {
                throw new chevre.factory.errors.NotFound('AccounTitle');
            }
            if (req.method === 'POST') {
                // バリデーション
                validate(req);
                const validatorResult = yield req.getValidationResult();
                errors = req.validationErrors(true);
                if (validatorResult.isEmpty()) {
                    // 作品DB登録
                    try {
                        accountTitle = {
                            project: req.project,
                            typeOf: 'AccountTitle',
                            codeValue: req.body.codeValue,
                            name: req.body.name,
                            description: req.body.description
                        };
                        debug('saving account title...', accountTitle);
                        yield accountTitleService.updateAccounTitleCategory(accountTitle);
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);
                        return;
                    }
                    catch (error) {
                        message = error.message;
                    }
                }
            }
            const forms = Object.assign(Object.assign({}, accountTitle), req.body);
            res.render('accountTitles/accountTitleCategory/edit', {
                message: message,
                errors: errors,
                forms: forms
            });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.update = update;
/**
 * 科目分類検証
 */
function validate(req) {
    // 科目分類コード
    let colName = '科目分類コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('codeValue', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目分類名称
    colName = '科目分類名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
