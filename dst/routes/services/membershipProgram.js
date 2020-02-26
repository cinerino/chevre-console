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
 * 会員プログラム管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const http_status_1 = require("http-status");
const _ = require("underscore");
const Message = require("../../common/Const/Message");
const NUM_ADDITIONAL_PROPERTY = 10;
const membershipProgramRouter = express_1.Router();
membershipProgramRouter.all('/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // 検証
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            try {
                let product = createFromBody(req);
                product = yield productService.create(product);
                req.flash('message', '登録しました');
                res.redirect(`/services/membershipProgram/${product.id}`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [], name: {}, alternateName: {}, description: {}, priceSpecification: {
            referenceQuantity: {
                value: 1
            },
            accounting: {}
        }, itemOffered: { name: {} }, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('services/membershipProgram/new', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
membershipProgramRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const searchConditions = {
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            typeOf: { $eq: 'Service' },
            serviceOutput: { typeOf: { $eq: chevre.factory.programMembership.ProgramMembershipType.ProgramMembership } }
        };
        const { data } = yield productService.search(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((t) => {
                return Object.assign({}, t);
            })
        });
    }
    catch (err) {
        res.json({
            success: false,
            message: err.message,
            count: 0,
            results: []
        });
    }
}));
membershipProgramRouter.all('/:id', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let message = '';
        let errors = {};
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let product = yield productService.findById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    product = createFromBody(req);
                    yield productService.update(product);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        else if (req.method === 'DELETE') {
            yield productService.deleteById({ id: req.params.id });
            res.status(http_status_1.NO_CONTENT)
                .end();
            return;
        }
        const forms = Object.assign({}, product);
        res.render('services/membershipProgram/update', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
    catch (err) {
        next(err);
    }
}));
membershipProgramRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('services/membershipProgram/index', {
        message: ''
    });
}));
function createFromBody(req) {
    const body = req.body;
    return {
        project: req.project,
        typeOf: 'Service',
        id: req.params.id,
        // identifier: body.identifier,
        name: body.name,
        serviceOutput: {
            typeOf: chevre.factory.programMembership.ProgramMembershipType
        }
    };
}
function validate(req) {
    let colName = '';
    // colName = '区分分類';
    // req.checkBody('inCodeSet.identifier').notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName));
    // colName = '区分コード';
    // req.checkBody('codeValue')
    //     .notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName))
    //     .isAlphanumeric()
    //     .len({ max: 20 })
    //     // tslint:disable-next-line:no-magic-numbers
    //     .withMessage(Message.Common.getMaxLength(colName, 20));
    colName = '名称';
    req.checkBody('name.ja').notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        // tslint:disable-next-line:no-magic-numbers
        .withMessage(Message.Common.getMaxLength(colName, 30));
}
exports.default = membershipProgramRouter;
