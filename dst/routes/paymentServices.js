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
 * 決済サービスルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../message");
const paymentServiceType_1 = require("../factory/paymentServiceType");
const NUM_ADDITIONAL_PROPERTY = 10;
const paymentServicesRouter = express_1.Router();
paymentServicesRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // 検証
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        // 検証
        if (validatorResult.isEmpty()) {
            try {
                let product = createFromBody(req, true);
                // プロダクトID重複確認
                const searchProductsResult = yield productService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    productID: { $eq: product.productID }
                });
                if (searchProductsResult.data.length > 0) {
                    throw new Error('既に存在するプロダクトIDです');
                }
                product = yield productService.create(product);
                req.flash('message', '登録しました');
                res.redirect(`/paymentServices/${product.id}`);
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
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    const sellerService = new chevre.service.Seller({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchSellersResult = yield sellerService.search({ project: { id: { $eq: req.project.id } } });
    res.render('paymentServices/new', {
        message: message,
        errors: errors,
        forms: forms,
        paymentServiceTypes: paymentServiceType_1.paymentServiceTypes,
        sellers: searchSellersResult.data
    });
}));
paymentServicesRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
            typeOf: (typeof ((_a = req.query.typeOf) === null || _a === void 0 ? void 0 : _a.$eq) === 'string' && req.query.typeOf.$eq.length > 0)
                ? { $eq: req.query.typeOf.$eq }
                : {
                    $in: [
                        chevre.factory.service.paymentService.PaymentServiceType.CreditCard,
                        chevre.factory.service.paymentService.PaymentServiceType.MovieTicket
                    ]
                }
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
// tslint:disable-next-line:use-default-type-parameter
paymentServicesRouter.all('/:id', ...validate(), 
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
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    product = createFromBody(req, false);
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
        const forms = Object.assign(Object.assign({}, product), { offersValidFrom: (Array.isArray(product.offers) && product.offers.length > 0 && product.offers[0].validFrom !== undefined)
                ? moment(product.offers[0].validFrom)
                    // .add(-1, 'day')
                    .tz('Asia/Tokyo')
                    .format('YYYY/MM/DD')
                : '', offersValidThrough: (Array.isArray(product.offers)
                && product.offers.length > 0
                && product.offers[0].validThrough !== undefined)
                ? moment(product.offers[0].validThrough)
                    .add(-1, 'day')
                    .tz('Asia/Tokyo')
                    .format('YYYY/MM/DD')
                : '' });
        const sellerService = new chevre.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchSellersResult = yield sellerService.search({ project: { id: { $eq: req.project.id } } });
        res.render('paymentServices/update', {
            message: message,
            errors: errors,
            forms: forms,
            paymentServiceTypes: paymentServiceType_1.paymentServiceTypes,
            sellers: searchSellersResult.data
        });
    }
    catch (err) {
        next(err);
    }
}));
paymentServicesRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sellerService = new chevre.service.Seller({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchSellersResult = yield sellerService.search({ project: { id: { $eq: req.project.id } } });
    res.render('paymentServices/index', {
        message: '',
        paymentServiceTypes: paymentServiceType_1.paymentServiceTypes,
        sellers: searchSellersResult.data
    });
}));
// tslint:disable-next-line:cyclomatic-complexity
function createFromBody(req, isNew) {
    let availableChannel;
    if (typeof req.body.availableChannelStr === 'string' && req.body.availableChannelStr.length > 0) {
        try {
            availableChannel = JSON.parse(req.body.availableChannelStr);
        }
        catch (error) {
            throw new Error(`invalid offers ${error.message}`);
        }
    }
    let serviceOutput;
    if (typeof req.body.serviceOutputStr === 'string' && req.body.serviceOutputStr.length > 0) {
        try {
            serviceOutput = JSON.parse(req.body.serviceOutputStr);
        }
        catch (error) {
            throw new Error(`invalid serviceOutput ${error.message}`);
        }
    }
    return Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: req.body.typeOf, id: req.params.id, productID: req.body.productID, name: req.body.name }, (availableChannel !== undefined) ? { availableChannel } : undefined), (serviceOutput !== undefined) ? { serviceOutput } : undefined), (!isNew)
        ? {
            $unset: Object.assign(Object.assign({}, (availableChannel === undefined) ? { availableChannel: 1 } : undefined), (serviceOutput === undefined) ? { serviceOutput: 1 } : undefined)
        }
        : undefined);
}
function validate() {
    return [
        express_validator_1.body('typeOf')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'プロダクトタイプ')),
        express_validator_1.body('productID')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'プロダクトID'))
            .matches(/^[0-9a-zA-Z]+$/)
            // tslint:disable-next-line:no-magic-numbers
            .isLength({ max: 30 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('プロダクトID', 30)),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .isLength({ max: 30 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30))
    ];
}
exports.default = paymentServicesRouter;
