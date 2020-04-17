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
 * 科目分類管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Message = require("../../message");
const debug = createDebug('chevre-backend:routes');
const NAME_MAX_LENGTH_CODE = 30;
const NAME_MAX_LENGTH_NAME_JA = 64;
const accountTitleCategoryRouter = express_1.Router();
accountTitleCategoryRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
accountTitleCategoryRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                const accountTitleCategory = createFromBody(req, true);
                debug('saving account title...', accountTitleCategory);
                const accountTitleService = new chevre.service.AccountTitle({
                    endpoint: process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                yield accountTitleService.createAccounTitleCategory(accountTitleCategory);
                req.flash('message', '登録しました');
                res.redirect(`/accountTitles/accountTitleCategory/${accountTitleCategory.codeValue}`);
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
}));
// tslint:disable-next-line:use-default-type-parameter
accountTitleCategoryRouter.all('/:codeValue', ...validate(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        let accountTitleCategory = searchAccountTitlesResult.data.shift();
        if (accountTitleCategory === undefined) {
            throw new chevre.factory.errors.NotFound('AccounTitle');
        }
        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    accountTitleCategory = createFromBody(req, false);
                    debug('saving account title...', accountTitleCategory);
                    yield accountTitleService.updateAccounTitleCategory(accountTitleCategory);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign({}, accountTitleCategory), req.body);
        res.render('accountTitles/accountTitleCategory/edit', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
    catch (error) {
        next(error);
    }
}));
function createFromBody(req, isNew) {
    return Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: 'AccountTitle', codeValue: req.body.codeValue, name: req.body.name }, (isNew)
        ? { hasCategoryCode: [] }
        : undefined);
}
/**
 * 科目分類検証
 */
function validate() {
    return [
        express_validator_1.body('codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLengthHalfByte('コード', NAME_MAX_LENGTH_CODE))
            .matches(/^[0-9a-zA-Z]+$/)
            .withMessage(() => '英数字で入力してください'),
        express_validator_1.body('name')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA })
            .withMessage(Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_NAME_JA))
    ];
}
exports.default = accountTitleCategoryRouter;
