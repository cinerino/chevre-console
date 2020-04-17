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
 * 勘定科目管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Message = require("../message");
const debug = createDebug('chevre-backend:routes');
const NAME_MAX_LENGTH_CODE = 30;
const NAME_MAX_LENGTH_NAME_JA = 64;
const NUM_ADDITIONAL_PROPERTY = 5;
const accountTitleCategory_1 = require("./accountTitles/accountTitleCategory");
const accountTitleSet_1 = require("./accountTitles/accountTitleSet");
const accountTitlesRouter = express_1.Router();
accountTitlesRouter.use('/accountTitleCategory', accountTitleCategory_1.default);
accountTitlesRouter.use('/accountTitleSet', accountTitleSet_1.default);
accountTitlesRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    // 科目分類検索
    const searchAccountTitleCategoriesResult = yield accountTitleService.searchAccountTitleCategories({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    // 科目検索
    const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    res.render('accountTitles/index', {
        forms: {},
        accountTitleCategories: searchAccountTitleCategoriesResult.data,
        accountTitleSets: searchAccountTitleSetsResult.data.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
    });
}));
accountTitlesRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        debug('searching...', req.query);
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield accountTitleService.search({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '')
                ? { $eq: req.query.codeValue }
                : undefined,
            inCodeSet: {
                codeValue: (req.query.inCodeSet.codeValue !== undefined && req.query.inCodeSet.codeValue !== '')
                    ? { $eq: req.query.inCodeSet.codeValue }
                    : undefined,
                inCodeSet: {
                    codeValue: (req.query.inCodeSet.inCodeSet.codeValue !== undefined && req.query.inCodeSet.inCodeSet.codeValue !== '')
                        ? { $eq: req.query.inCodeSet.inCodeSet.codeValue }
                        : undefined
                }
            }
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
}));
accountTitlesRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // バリデーション
        // validate(req);
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                const accountTitle = yield createFromBody(req);
                debug('saving account title...', accountTitle);
                yield accountTitleService.create(accountTitle);
                req.flash('message', '登録しました');
                res.redirect(`/accountTitles/${accountTitle.codeValue}`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [], inCodeSet: {} }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    // 科目分類検索
    const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    const accountTitleSets = searchAccountTitleSetsResult.data;
    res.render('accountTitles/new', {
        message: message,
        errors: errors,
        forms: forms,
        accountTitleSets: accountTitleSets.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
    });
}));
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.all('/:codeValue', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchAccountTitlesResult = yield accountTitleService.search({
        project: { ids: [req.project.id] },
        codeValue: { $eq: req.params.codeValue }
    });
    let accountTitle = searchAccountTitlesResult.data.shift();
    if (accountTitle === undefined) {
        throw new chevre.factory.errors.NotFound('AccounTitle');
    }
    if (req.method === 'POST') {
        // バリデーション
        // validate(req);
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        console.error('errors', errors);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                accountTitle = yield createFromBody(req);
                debug('saving account title...', accountTitle);
                yield accountTitleService.update(accountTitle);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    // 科目分類検索
    const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    const accountTitleSets = searchAccountTitleSetsResult.data;
    const forms = Object.assign(Object.assign({ additionalProperty: [] }, accountTitle), req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('accountTitles/edit', {
        message: message,
        errors: errors,
        forms: forms,
        accountTitleSets: accountTitleSets.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
    });
}));
function createFromBody(req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 科目検索
        const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
            limit: 1,
            project: { ids: [req.project.id] },
            codeValue: { $eq: (_a = req.body.inCodeSet) === null || _a === void 0 ? void 0 : _a.codeValue }
        });
        const accountTitleSet = searchAccountTitleSetsResult.data.shift();
        if (accountTitleSet === undefined) {
            throw new Error('科目が見つかりません');
        }
        return {
            project: { typeOf: req.project.typeOf, id: req.project.id },
            typeOf: 'AccountTitle',
            codeValue: req.body.codeValue,
            name: req.body.name,
            inCodeSet: accountTitleSet,
            additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined
        };
    });
}
/**
 * 細目バリデーション
 */
function validate() {
    return [
        express_validator_1.body('inCodeSet.codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '科目')),
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
exports.default = accountTitlesRouter;
