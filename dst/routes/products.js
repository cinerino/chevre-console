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
 * プロダクトルーター
 */
const sdk_1 = require("@cinerino/sdk");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const addOn_1 = require("./products/addOn");
const NUM_ADDITIONAL_PROPERTY = 10;
const productsRouter = express_1.Router();
productsRouter.use('/addOn', addOn_1.default);
productsRouter.all('/new', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const productService = new sdk_1.chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    const offerCatalogService = new sdk_1.chevre.service.OfferCatalog({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
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
                product = (yield productService.create(product));
                req.flash('message', '登録しました');
                res.redirect(`/projects/${req.project.id}/products/${product.id}`);
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
        }, itemOffered: { name: {} }, typeOf: req.query.typeOf }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    if (req.method === 'POST') {
        // サービスアウトプットを保管
        if (typeof req.body.serviceOutputCategory === 'string' && req.body.serviceOutputCategory.length > 0) {
            forms.serviceOutputCategory = JSON.parse(req.body.serviceOutputCategory);
        }
        else {
            forms.serviceOutputCategory = undefined;
        }
        // 通貨区分を保管
        if (typeof req.body.serviceOutputAmount === 'string' && req.body.serviceOutputAmount.length > 0) {
            forms.serviceOutputAmount = JSON.parse(req.body.serviceOutputAmount);
        }
        else {
            forms.serviceOutputAmount = undefined;
        }
    }
    const searchOfferCatalogsResult = yield offerCatalogService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        itemOffered: { typeOf: { $eq: productType_1.ProductType.Product } }
    });
    const sellerService = new sdk_1.chevre.service.Seller({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    const searchSellersResult = yield sellerService.search({ project: { id: { $eq: req.project.id } } });
    res.render('products/new', {
        message: message,
        errors: errors,
        forms: forms,
        offerCatalogs: searchOfferCatalogsResult.data,
        productTypes: (typeof req.query.typeOf === 'string' && req.query.typeOf.length > 0)
            ? productType_1.productTypes.filter((p) => p.codeValue === req.query.typeOf)
            : productType_1.productTypes,
        sellers: searchSellersResult.data
    });
}));
productsRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const productService = new sdk_1.chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const offersValidFromLte = (typeof ((_b = (_a = req.query.offers) === null || _a === void 0 ? void 0 : _a.$elemMatch) === null || _b === void 0 ? void 0 : _b.validThrough) === 'string'
            && req.query.offers.$elemMatch.validThrough.length > 0)
            ? moment(`${req.query.offers.$elemMatch.validThrough}T23:59:59+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate()
            : undefined;
        const offersValidThroughGte = (typeof ((_d = (_c = req.query.offers) === null || _c === void 0 ? void 0 : _c.$elemMatch) === null || _d === void 0 ? void 0 : _d.validFrom) === 'string'
            && req.query.offers.$elemMatch.validFrom.length > 0)
            ? moment(`${req.query.offers.$elemMatch.validFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate()
            : undefined;
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const searchConditions = {
            limit: limit,
            page: page,
            // sort: { 'priceSpecification.price': chevre.factory.sortType.Ascending },
            project: { id: { $eq: req.project.id } },
            typeOf: { $eq: (_e = req.query.typeOf) === null || _e === void 0 ? void 0 : _e.$eq },
            hasOfferCatalog: {
                id: {
                    $eq: (typeof ((_f = req.query.hasOfferCatalog) === null || _f === void 0 ? void 0 : _f.id) === 'string' && req.query.hasOfferCatalog.id.length > 0)
                        ? req.query.hasOfferCatalog.id
                        : undefined
                }
            },
            offers: {
                $elemMatch: {
                    validFrom: {
                        $lte: (offersValidFromLte instanceof Date) ? offersValidFromLte : undefined
                    },
                    validThrough: {
                        $gte: (offersValidThroughGte instanceof Date) ? offersValidThroughGte : undefined
                    },
                    'seller.id': {
                        $in: (typeof ((_j = (_h = (_g = req.query.offers) === null || _g === void 0 ? void 0 : _g.$elemMatch) === null || _h === void 0 ? void 0 : _h.seller) === null || _j === void 0 ? void 0 : _j.id) === 'string'
                            && req.query.offers.$elemMatch.seller.id.length > 0)
                            ? [req.query.offers.$elemMatch.seller.id]
                            : undefined
                    }
                }
            },
            name: {
                $regex: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
            },
            serviceOutput: {
                amount: {
                    currency: {
                        $eq: (typeof ((_l = (_k = req.query.serviceOutput) === null || _k === void 0 ? void 0 : _k.amount) === null || _l === void 0 ? void 0 : _l.currency) === 'string'
                            && req.query.serviceOutput.amount.currency.length > 0)
                            ? req.query.serviceOutput.amount.currency
                            : undefined
                    }
                },
                typeOf: {
                    $eq: (typeof req.query.paymentMethodType === 'string' && req.query.paymentMethodType.length > 0)
                        ? req.query.paymentMethodType
                        : (typeof req.query.membershipType === 'string' && req.query.membershipType.length > 0)
                            ? req.query.membershipType
                            : undefined
                }
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
productsRouter.all('/:id', ...validate(), 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m, _o, _p;
    try {
        let message = '';
        let errors = {};
        const categoryCodeService = new sdk_1.chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const productService = new sdk_1.chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const offerCatalogService = new sdk_1.chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
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
            try {
                // validation
                yield preDelete(req, product);
                yield productService.deleteById({ id: req.params.id });
                res.status(http_status_1.NO_CONTENT)
                    .end();
            }
            catch (error) {
                res.status(http_status_1.BAD_REQUEST)
                    .json({ error: { message: error.message } });
            }
            return;
        }
        const forms = Object.assign(Object.assign(Object.assign({}, product), { offersValidFrom: (Array.isArray(product.offers) && product.offers.length > 0 && product.offers[0].validFrom !== undefined)
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
                : '' }), req.body);
        if (req.method === 'POST') {
            // サービスアウトプットを保管
            if (typeof req.body.serviceOutputCategory === 'string' && req.body.serviceOutputCategory.length > 0) {
                forms.serviceOutputCategory = JSON.parse(req.body.serviceOutputCategory);
            }
            else {
                forms.serviceOutputCategory = undefined;
            }
            // 通貨区分を保管
            if (typeof req.body.serviceOutputAmount === 'string' && req.body.serviceOutputAmount.length > 0) {
                forms.serviceOutputAmount = JSON.parse(req.body.serviceOutputAmount);
            }
            else {
                forms.serviceOutputAmount = undefined;
            }
        }
        else {
            // サービスアウトプットを保管
            if (typeof ((_m = product.serviceOutput) === null || _m === void 0 ? void 0 : _m.typeOf) === 'string') {
                if (product.typeOf === sdk_1.chevre.factory.product.ProductType.MembershipService) {
                    const searchMembershipTypesResult = yield categoryCodeService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        inCodeSet: { identifier: { $eq: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.MembershipType } },
                        codeValue: { $eq: product.serviceOutput.typeOf }
                    });
                    forms.serviceOutputCategory = searchMembershipTypesResult.data[0];
                }
                else if (product.typeOf === sdk_1.chevre.factory.product.ProductType.PaymentCard) {
                    const searchPaymentMethodTypesResult = yield categoryCodeService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        inCodeSet: { identifier: { $eq: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.PaymentMethodType } },
                        codeValue: { $eq: product.serviceOutput.typeOf }
                    });
                    forms.serviceOutputCategory = searchPaymentMethodTypesResult.data[0];
                }
            }
            // 通貨区分を保管
            if (typeof ((_p = (_o = product.serviceOutput) === null || _o === void 0 ? void 0 : _o.amount) === null || _p === void 0 ? void 0 : _p.currency) === 'string') {
                if (product.serviceOutput.amount.currency === sdk_1.chevre.factory.priceCurrency.JPY) {
                    forms.serviceOutputAmount = {
                        codeValue: product.serviceOutput.amount.currency,
                        name: { ja: product.serviceOutput.amount.currency }
                    };
                }
                else {
                    const searchCurrencyTypesResult = yield categoryCodeService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        inCodeSet: { identifier: { $eq: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.CurrencyType } },
                        codeValue: { $eq: product.serviceOutput.amount.currency }
                    });
                    forms.serviceOutputAmount = searchCurrencyTypesResult.data[0];
                }
            }
        }
        const searchOfferCatalogsResult = yield offerCatalogService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            itemOffered: { typeOf: { $eq: product.typeOf } }
        });
        const sellerService = new sdk_1.chevre.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchSellersResult = yield sellerService.search({ project: { id: { $eq: req.project.id } } });
        res.render('products/update', {
            message: message,
            errors: errors,
            forms: forms,
            offerCatalogs: searchOfferCatalogsResult.data,
            productTypes: productType_1.productTypes.filter((p) => p.codeValue === product.typeOf),
            sellers: searchSellersResult.data
        });
    }
    catch (err) {
        next(err);
    }
}));
function preDelete(req, product) {
    return __awaiter(this, void 0, void 0, function* () {
        // validation
        const offerService = new sdk_1.chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchOffersResult = yield offerService.search({
            limit: 1,
            project: { id: { $eq: req.project.id } },
            addOn: { itemOffered: { id: { $eq: product.id } } }
        });
        if (searchOffersResult.data.length > 0) {
            throw new Error('関連するオファーが存在します');
        }
    });
}
productsRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('products/index', {
        message: '',
        productTypes: (typeof req.query.typeOf === 'string')
            ? productType_1.productTypes.filter((p) => p.codeValue === req.query.typeOf)
            : productType_1.productTypes
    });
}));
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req, isNew) {
    var _a, _b, _c, _d, _e;
    let hasOfferCatalog;
    if (typeof ((_a = req.body.hasOfferCatalog) === null || _a === void 0 ? void 0 : _a.id) === 'string' && ((_b = req.body.hasOfferCatalog) === null || _b === void 0 ? void 0 : _b.id.length) > 0) {
        hasOfferCatalog = {
            typeOf: 'OfferCatalog',
            id: (_c = req.body.hasOfferCatalog) === null || _c === void 0 ? void 0 : _c.id
        };
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
    switch (req.body.typeOf) {
        case sdk_1.chevre.factory.product.ProductType.MembershipService:
        case sdk_1.chevre.factory.product.ProductType.PaymentCard:
            let serviceOutputCategory;
            try {
                serviceOutputCategory = JSON.parse(req.body.serviceOutputCategory);
            }
            catch (error) {
                throw new Error(`invalid serviceOutputCategory ${error.message}`);
            }
            if (serviceOutput === undefined) {
                serviceOutput = {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: serviceOutputCategory.codeValue
                };
            }
            else {
                serviceOutput.typeOf = serviceOutputCategory.codeValue;
            }
            if (typeof req.body.serviceOutputAmount === 'string' && req.body.serviceOutputAmount.length > 0) {
                let serviceOutputAmount;
                try {
                    serviceOutputAmount = JSON.parse(req.body.serviceOutputAmount);
                }
                catch (error) {
                    throw new Error(`invalid serviceOutputAmount ${error.message}`);
                }
                serviceOutput.amount = { currency: serviceOutputAmount.codeValue, typeOf: 'MonetaryAmount' };
            }
            break;
        default:
            serviceOutput = undefined;
    }
    let offers;
    let sellerIds = (_e = (_d = req.body.offers) === null || _d === void 0 ? void 0 : _d.seller) === null || _e === void 0 ? void 0 : _e.id;
    if (typeof sellerIds === 'string' && sellerIds.length > 0) {
        sellerIds = [sellerIds];
    }
    if (Array.isArray(sellerIds)) {
        if (typeof req.body.offersValidFrom === 'string'
            && req.body.offersValidFrom.length > 0
            && typeof req.body.offersValidThrough === 'string'
            && req.body.offersValidThrough.length > 0) {
            const validFrom = moment(`${req.body.offersValidFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate();
            const validThrough = moment(`${req.body.offersValidThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .add(1, 'day')
                .toDate();
            offers = sellerIds.map((sellerId) => {
                return {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: sdk_1.chevre.factory.offerType.Offer,
                    priceCurrency: sdk_1.chevre.factory.priceCurrency.JPY,
                    availabilityEnds: validThrough,
                    availabilityStarts: validFrom,
                    validFrom: validFrom,
                    validThrough: validThrough,
                    seller: {
                        id: sellerId
                    }
                };
            });
        }
    }
    if (typeof req.body.offersStr === 'string' && req.body.offersStr.length > 0) {
        // try {
        //     offers = JSON.parse(req.body.offersStr);
        //     if (!Array.isArray(offers)) {
        //         throw Error('offers must be an array');
        //     }
        // } catch (error) {
        //     throw new Error(`invalid offers ${error.message}`);
        // }
    }
    return Object.assign(Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: req.body.typeOf, id: req.params.id, productID: req.body.productID, name: req.body.name }, (hasOfferCatalog !== undefined) ? { hasOfferCatalog } : undefined), (offers !== undefined) ? { offers } : undefined), (serviceOutput !== undefined) ? { serviceOutput } : undefined), (!isNew)
        ? {
            $unset: Object.assign(Object.assign(Object.assign({}, (hasOfferCatalog === undefined) ? { hasOfferCatalog: 1 } : undefined), (offers === undefined) ? { offers: 1 } : undefined), (serviceOutput === undefined) ? { serviceOutput: 1 } : undefined)
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
            .withMessage(Message.Common.getMaxLength('名称', 30)),
        express_validator_1.body('name.en')
            .optional()
            // tslint:disable-next-line:no-magic-numbers
            .isLength({ max: 30 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('英語名称', 30)),
        express_validator_1.body('serviceOutputCategory')
            .if((_, { req }) => [
            sdk_1.chevre.factory.product.ProductType.MembershipService
        ].includes(req.body.typeOf))
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'メンバーシップ区分')),
        express_validator_1.body('serviceOutputCategory')
            .if((_, { req }) => [
            sdk_1.chevre.factory.product.ProductType.PaymentCard
        ].includes(req.body.typeOf))
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '決済方法区分')),
        express_validator_1.body('serviceOutputAmount')
            .if((_, { req }) => [
            sdk_1.chevre.factory.product.ProductType.PaymentCard
        ].includes(req.body.typeOf))
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '通貨区分'))
    ];
}
exports.default = productsRouter;
