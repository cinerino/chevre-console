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
 * カテゴリーコードルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Message = require("../message");
const categoryCodeSet_1 = require("../factory/categoryCodeSet");
const categoryCodesRouter = express_1.Router();
categoryCodesRouter.get('', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('categoryCodes/index', {
        message: '',
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
        categoryCodeSets: categoryCodeSet_1.categoryCodeSets
    });
}));
categoryCodesRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield categoryCodeService.search(Object.assign(Object.assign(Object.assign({ limit: limit, page: page, project: { id: { $eq: req.project.id } } }, (req.query.codeValue !== undefined && req.query.codeValue !== null
            && typeof req.query.codeValue.$eq === 'string' && req.query.codeValue.$eq.length > 0)
            ? { codeValue: { $eq: req.query.codeValue.$eq } }
            : undefined), (req.query.inCodeSet !== undefined && req.query.inCodeSet !== null
            && typeof req.query.inCodeSet.identifier === 'string' && req.query.inCodeSet.identifier.length > 0)
            ? { inCodeSet: { identifier: { $eq: req.query.inCodeSet.identifier } } }
            : undefined), (req.query.name !== undefined && req.query.name !== null
            && typeof req.query.name.$regex === 'string' && req.query.name.$regex.length > 0)
            ? { name: { $regex: req.query.name.$regex } }
            : undefined));
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((d) => {
                const categoryCodeSet = categoryCodeSet_1.categoryCodeSets.find((c) => c.identifier === d.inCodeSet.identifier);
                return Object.assign(Object.assign({}, d), { categoryCodeSetName: categoryCodeSet === null || categoryCodeSet === void 0 ? void 0 : categoryCodeSet.name });
            })
        });
    }
    catch (error) {
        res.json({
            success: false,
            message: error.message,
            count: 0,
            results: []
        });
    }
}));
categoryCodesRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                let categoryCode = createMovieFromBody(req);
                // コード重複確認
                const { data } = yield categoryCodeService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    codeValue: { $eq: categoryCode.codeValue },
                    inCodeSet: { identifier: { $eq: categoryCode.inCodeSet.identifier } }
                });
                if (data.length > 0) {
                    throw new Error('既に存在するコードです');
                }
                categoryCode = yield categoryCodeService.create(categoryCode);
                req.flash('message', '登録しました');
                res.redirect(`/categoryCodes/${categoryCode.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ appliesToCategoryCode: {} }, req.body);
    res.render('categoryCodes/new', {
        message: message,
        errors: errors,
        forms: forms,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
        categoryCodeSets: categoryCodeSet_1.categoryCodeSets
    });
}));
// tslint:disable-next-line:use-default-type-parameter
categoryCodesRouter.all('/:id/update', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let categoryCode = yield categoryCodeService.findById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            // コンテンツDB登録
            try {
                categoryCode = Object.assign(Object.assign({}, createMovieFromBody(req)), { id: categoryCode.id });
                yield categoryCodeService.update(categoryCode);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign({}, categoryCode), req.body);
    res.render('categoryCodes/update', {
        message: message,
        errors: errors,
        forms: forms,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
        categoryCodeSets: categoryCodeSet_1.categoryCodeSets
    });
}));
function createMovieFromBody(req) {
    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: 'CategoryCode',
        codeValue: req.body.codeValue,
        inCodeSet: {
            typeOf: 'CategoryCodeSet',
            identifier: req.body.inCodeSet.identifier
        },
        name: { ja: req.body.name.ja }
    };
}
function validate() {
    return [
        express_validator_1.body('inCodeSet.identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '区分分類')),
        express_validator_1.body('codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            // .isAlphanumeric()
            .matches(/^[0-9a-zA-Z\+]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('コード', 20)),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30))
    ];
}
exports.default = categoryCodesRouter;
