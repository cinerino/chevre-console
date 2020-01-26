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
const Message = require("../common/Const/Message");
const debug = createDebug('chevre-backend:controllers');
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
const NUM_ADDITIONAL_PROPERTY = 5;
/**
 * 科目分類作成
 */
function createAccountTitleCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitleCategory(req);
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
exports.createAccountTitleCategory = createAccountTitleCategory;
/**
 * 科目分類検索
 */
function searchAccountTitleCategory(req, res) {
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
exports.searchAccountTitleCategory = searchAccountTitleCategory;
/**
 * 科目分類編集
 */
function updateAccountTitleCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchAccountTitlesResult = yield accountTitleService.searchAccountTitleCategories({
            project: { ids: [req.project.id] },
            codeValue: req.params.codeValue
        });
        let accountTitle = searchAccountTitlesResult.data.shift();
        if (accountTitle === undefined) {
            throw new chevre.factory.errors.NotFound('AccounTitle');
        }
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitleCategory(req);
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
        const forms = Object.assign({}, accountTitle, req.body);
        res.render('accountTitles/accountTitleCategory/edit', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.updateAccountTitleCategory = updateAccountTitleCategory;
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
    });
}
exports.getList = getList;
/**
 * 一覧
 */
function index(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
        debug(searchAccountTitleCategoriesResult);
        // 科目検索
        const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        debug(searchAccountTitleSetsResult);
        res.render('accountTitles/index', {
            forms: {},
            accountTitleCategories: searchAccountTitleCategoriesResult.data,
            accountTitleSets: searchAccountTitleSetsResult.data.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
        });
    });
}
exports.index = index;
/**
 * 科目新規登録画面検証
 */
function validateAccountTitleCategory(req) {
    // 科目分類コード
    let colName = '科目分類コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('codeValue', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目分類名称
    colName = '科目分類名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
/**
 * 科目追加
 */
function addAccountTitleSet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
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
        const accountTitleCategories = searchAccountTitleCategoriesResult.data;
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitleSet(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitleCategory = accountTitleCategories.find((a) => a.codeValue === req.body.inCodeSet.codeValue);
                    const accountTitle = {
                        project: req.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.codeValue,
                        name: req.body.name,
                        description: req.body.description,
                        hasCategoryCode: [],
                        inCodeSet: accountTitleCategory,
                        inDefinedTermSet: req.body.inDefinedTermSet
                    };
                    debug('saving account title...', accountTitle);
                    yield accountTitleService.createAccounTitleSet(accountTitle);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles/accountTitleSet/${accountTitle.codeValue}`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({ inCodeSet: {}, inDefinedTermSet: {} }, req.body);
        res.render('accountTitles/accountTitleSet/add', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleCategories: accountTitleCategories
        });
    });
}
exports.addAccountTitleSet = addAccountTitleSet;
/**
 * 科目検索
 */
function searchAccountTitleSet(req, res) {
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
                const { data } = yield accountTitleService.searchAccountTitleSets({
                    limit: limit,
                    page: page,
                    project: { ids: [req.project.id] },
                    codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '') ? req.query.codeValue : undefined,
                    inCodeSet: {
                        codeValue: (req.query.inCodeSet.codeValue !== undefined && req.query.inCodeSet.codeValue !== '')
                            ? { $eq: req.query.inCodeSet.codeValue }
                            : undefined
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
        }
        else {
            // 科目分類検索
            const searchAccountTitleCategoriesResult = yield accountTitleService.searchAccountTitleCategories({
                limit: 100,
                sort: { codeValue: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] }
            });
            debug(searchAccountTitleCategoriesResult);
            res.render('accountTitles/accountTitleSet/index', {
                forms: {},
                accountTitleCategories: searchAccountTitleCategoriesResult.data
            });
        }
    });
}
exports.searchAccountTitleSet = searchAccountTitleSet;
/**
 * 科目編集
 */
function updateAccountTitleSet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchAccountTitlesResult = yield accountTitleService.searchAccountTitleSets({
            project: { ids: [req.project.id] },
            codeValue: req.params.codeValue
        });
        let accountTitle = searchAccountTitlesResult.data.shift();
        if (accountTitle === undefined) {
            throw new chevre.factory.errors.NotFound('AccounTitle');
        }
        debug('accountTitle found', accountTitle);
        // 科目分類検索
        const searchAccountTitleCategoriesResult = yield accountTitleService.searchAccountTitleCategories({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleCategories = searchAccountTitleCategoriesResult.data;
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitleSet(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    accountTitle = {
                        project: req.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.codeValue,
                        name: req.body.name,
                        description: req.body.description,
                        inDefinedTermSet: req.body.inDefinedTermSet
                    };
                    debug('saving account title...', accountTitle);
                    yield accountTitleService.updateAccounTitleSet(accountTitle);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({ inCodeSet: {}, inDefinedTermSet: {} }, accountTitle, req.body);
        res.render('accountTitles/accountTitleSet/edit', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleCategories: accountTitleCategories
        });
    });
}
exports.updateAccountTitleSet = updateAccountTitleSet;
/**
 * 科目バリデーション
 */
function validateAccountTitleSet(req) {
    let colName = '科目分類';
    req.checkBody('inCodeSet.codeValue', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '科目コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('codeValue', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    colName = '科目名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
/**
 * 科目分類作成
 */
function createAccountTitle(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 科目分類検索
        const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleSets = searchAccountTitleSetsResult.data;
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitle(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitleSet = accountTitleSets.find((a) => a.codeValue === req.body.inCodeSet.codeValue);
                    const accountTitle = {
                        project: req.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.codeValue,
                        name: req.body.name,
                        description: req.body.description,
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
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }
        res.render('accountTitles/new', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleSets: accountTitleSets.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
        });
    });
}
exports.createAccountTitle = createAccountTitle;
/**
 * 編集
 */
function updateAccountTitle(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchAccountTitlesResult = yield accountTitleService.search({
            project: { ids: [req.project.id] },
            codeValue: req.params.codeValue
        });
        let accountTitle = searchAccountTitlesResult.data.shift();
        if (accountTitle === undefined) {
            throw new chevre.factory.errors.NotFound('AccounTitle');
        }
        // 科目分類検索
        const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleSets = searchAccountTitleSetsResult.data;
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitle(req);
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
                        description: req.body.description,
                        inCodeSet: accountTitle.inCodeSet,
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
        const forms = Object.assign({ additionalProperty: [] }, accountTitle, req.body);
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
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
    });
}
exports.updateAccountTitle = updateAccountTitle;
/**
 * 細目バリデーション
 */
function validateAccountTitle(req) {
    let colName = '科目分類';
    req.checkBody('inCodeSet.codeValue', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '科目コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('codeValue', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    colName = '科目名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
