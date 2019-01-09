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
                        typeOf: 'AccountTitle',
                        codeValue: req.body.codeValue,
                        name: req.body.name,
                        description: req.body.description
                    };
                    debug('saving account title...', accountTitle);
                    const accountTitleService = new chevre.service.AccountTitle({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    yield accountTitleService.createAccounTitleCategory(accountTitle);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({}, req.body);
        // 作品マスタ画面遷移
        res.render('accountTitles/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.createAccountTitleCategory = createAccountTitleCategory;
/**
 * 編集
 */
// export async function update(req: Request, res: Response): Promise<void> {
//     const accountTitleService = new chevre.service.AccountTitle({
//         endpoint: <string>process.env.API_ENDPOINT,
//         auth: req.user.authClient
//     });
//     let message = '';
//     let errors: any = {};
//     let accountTitle = await accountTitleService.findByIdentifier({
//         identifier: req.params.identifier
//     });
//     if (req.method === 'POST') {
//         // バリデーション
//         validate(req);
//         const validatorResult = await req.getValidationResult();
//         errors = req.validationErrors(true);
//         if (validatorResult.isEmpty()) {
//             // 作品DB登録
//             try {
//                 accountTitle = createFromBody(req.body);
//                 debug('saving account title...', accountTitle);
//                 await accountTitleService.update(accountTitle);
//                 req.flash('message', '更新しました');
//                 res.redirect(req.originalUrl);
//                 return;
//             } catch (error) {
//                 message = error.message;
//             }
//         }
//     }
//     const forms = {
//         identifier: (_.isEmpty(req.body.identifier)) ? accountTitle.identifier : req.body.identifier,
//         name: (_.isEmpty(req.body.name)) ? accountTitle.name : req.body.name,
//         category: {
//             category: {}
//         },
//         ...{
//             category: (_.isEmpty(req.body.category))
//                 ? (accountTitle.category !== undefined)
//                     ? {
//                         category: {},
//                         ...accountTitle.category
//                     }
//                     : {
//                         category: {}
//                     }
//                 : req.body.category
//         }
//     };
//     // 作品マスタ画面遷移
//     res.render('accountTitles/edit', {
//         message: message,
//         errors: errors,
//         forms: forms
//     });
// }
// function createFromBody(body: any): chevre.factory.accountTitle.IAccountTitle {
//     return {
//         typeOf: 'AccountTitle',
//         identifier: body.identifier,
//         name: body.name,
//         description: body.description,
//         category: body.category
//     };
// }
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
            const result = yield accountTitleService.search({
                limit: Number(req.query.limit),
                page: Number(req.query.page),
                codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '') ? `^${req.query.codeValue}$` : undefined,
                inCodeSet: {
                    codeValue: (req.query.inCodeSet.codeValue !== undefined && req.query.inCodeSet.codeValue !== '')
                        ? `^${req.query.inCodeSet.codeValue}$`
                        : undefined,
                    inCodeSet: {
                        codeValue: (req.query.inCodeSet.inCodeSet.codeValue !== undefined && req.query.inCodeSet.inCodeSet.codeValue !== '')
                            ? `^${req.query.inCodeSet.inCodeSet.codeValue}$`
                            : undefined
                    }
                }
            });
            res.json({
                success: true,
                count: result.totalCount,
                results: result.data
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
        const searchAccountTitleCategoriesResult = yield accountTitleService.searchAccountTitleCategories({ limit: 100 });
        debug(searchAccountTitleCategoriesResult);
        // 科目検索
        const searchAccountTitleSetsResult = yield accountTitleService.searchAccountTitleSets({ limit: 100 });
        debug(searchAccountTitleSetsResult);
        res.render('accountTitles/index', {
            forms: {},
            accountTitleCategories: searchAccountTitleCategoriesResult.data,
            accountTitleSets: searchAccountTitleSetsResult.data
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
    // colName = '科目コード';
    // req.checkBody('category.identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody('category.identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
    //     .len({ max: NAME_MAX_LENGTH_CODE });
    // colName = '科目名称';
    // req.checkBody('category.name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody('category.name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
    //     .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // colName = '細目コード';
    // req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
    //     .len({ max: NAME_MAX_LENGTH_CODE });
    // colName = '細目名称';
    // req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
    //     .len({ max: NAME_MAX_LENGTH_NAME_JA });
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
        const searchAccountTitleCategoriesResult = yield accountTitleService.searchAccountTitleCategories({ limit: 100 });
        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitleSet(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitle = {
                        typeOf: 'AccountTitle',
                        codeValue: req.body.codeValue,
                        name: req.body.name,
                        description: req.body.description,
                        inCodeSet: {
                            typeOf: 'AccountTitle',
                            codeValue: req.body.inCodeSet.codeValue,
                            name: ''
                        }
                    };
                    debug('saving account title...', accountTitle);
                    yield accountTitleService.createAccounTitleSet(accountTitle);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles`);
                    return;
                }
                catch (error) {
                    console.error(error);
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({ inCodeSet: {} }, req.body);
        // 作品マスタ画面遷移
        res.render('accountTitles/hasCategoryCode/add', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleCategories: searchAccountTitleCategoriesResult.data
        });
    });
}
exports.addAccountTitleSet = addAccountTitleSet;
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
