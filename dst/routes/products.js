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
const chevre = require("@chevre/api-nodejs-client");
const cinerino = require("@cinerino/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const addOn_1 = require("./products/addOn");
const NUM_ADDITIONAL_PROPERTY = 10;
const productsRouter = express_1.Router();
productsRouter.use('/addOn', addOn_1.default);
productsRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
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
                product = yield productService.create(product);
                req.flash('message', '登録しました');
                res.redirect(`/products/${product.id}`);
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
    const searchOfferCatalogsResult = yield offerCatalogService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        itemOffered: { typeOf: { $eq: productType_1.ProductType.Product } }
    });
    const sellerService = new cinerino.service.Seller({
        endpoint: process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    const searchSellersResult = yield sellerService.search({});
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
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
            offers: {
                $elemMatch: {
                    validFrom: {
                        $lte: (offersValidFromLte instanceof Date) ? offersValidFromLte : undefined
                    },
                    validThrough: {
                        $gte: (offersValidThroughGte instanceof Date) ? offersValidThroughGte : undefined
                    },
                    'seller.id': {
                        $in: (typeof ((_h = (_g = (_f = req.query.offers) === null || _f === void 0 ? void 0 : _f.$elemMatch) === null || _g === void 0 ? void 0 : _g.seller) === null || _h === void 0 ? void 0 : _h.id) === 'string'
                            && req.query.offers.$elemMatch.seller.id.length > 0)
                            ? [req.query.offers.$elemMatch.seller.id]
                            : undefined
                    }
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
    try {
        let message = '';
        let errors = {};
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
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
        const searchOfferCatalogsResult = yield offerCatalogService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            itemOffered: { typeOf: { $eq: product.typeOf } }
        });
        const sellerService = new cinerino.service.Seller({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchSellersResult = yield sellerService.search({});
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
productsRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sellerService = new cinerino.service.Seller({
        endpoint: process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    const searchSellersResult = yield sellerService.search({});
    res.render('products/index', {
        message: '',
        productTypes: (typeof req.query.typeOf === 'string')
            ? productType_1.productTypes.filter((p) => p.codeValue === req.query.typeOf)
            : productType_1.productTypes,
        sellers: searchSellersResult.data
    });
}));
// tslint:disable-next-line:cyclomatic-complexity
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
                    typeOf: chevre.factory.offerType.Offer,
                    priceCurrency: chevre.factory.priceCurrency.JPY,
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
            .withMessage(Message.Common.getMaxLength('名称', 30))
    ];
}
exports.default = productsRouter;
