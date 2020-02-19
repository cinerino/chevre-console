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
 * アドオン管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const http_status_1 = require("http-status");
const Message = require("../common/Const/Message");
const NUM_ADDITIONAL_PROPERTY = 10;
const addOnsRouter = express_1.Router();
addOnsRouter.all('/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchProductsResult = yield productService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        typeOf: { $eq: 'Product' }
    });
    if (req.method === 'POST') {
        // 検証
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            try {
                const product = yield productService.findById({ id: req.body.itemOffered.id });
                let offer = createFromBody(req, product);
                // 券種コード重複確認
                const { data } = yield offerService.searchTicketTypes({
                    limit: 1,
                    project: { ids: [req.project.id] },
                    identifier: { $eq: offer.identifier }
                });
                if (data.length > 0) {
                    throw new Error(`既に存在する券種コードです: ${offer.identifier}`);
                }
                // オファーコード重複確認
                const searchOffersResult = yield offerService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: offer.identifier }
                });
                if (searchOffersResult.data.length > 0) {
                    throw new Error(`既に存在するオファーコードです: ${offer.identifier}`);
                }
                offer = yield offerService.create(offer);
                req.flash('message', '登録しました');
                res.redirect(`/addOns/${offer.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [], name: {}, priceSpecification: {
            referenceQuantity: {
                value: 1
            },
            accounting: {}
        }, itemOffered: { name: {} } }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('addOns/new', {
        message: message,
        errors: errors,
        forms: forms,
        products: searchProductsResult.data
    });
}));
addOnsRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const searchConditions = {
            limit: limit,
            page: page,
            sort: { 'priceSpecification.price': chevre.factory.sortType.Ascending },
            project: { id: { $eq: req.project.id } },
            itemOffered: {
                typeOf: { $eq: 'Product' }
            },
            id: (typeof req.query.id === 'string' && req.query.id.length > 0) ? { $eq: req.query.id } : undefined
            // name: (req.query.name !== undefined
            //     && req.query.name !== '')
            //     ? req.query.name
            //     : undefined
            // priceSpecification: {
            //     minPrice: (req.query.priceSpecification !== undefined
            //         && req.query.priceSpecification.minPrice !== undefined
            //         && req.query.priceSpecification.minPrice !== '')
            //         ? Number(req.query.priceSpecification.minPrice)
            //         : undefined,
            //     maxPrice: (req.query.priceSpecification !== undefined
            //         && req.query.priceSpecification.maxPrice !== undefined
            //         && req.query.priceSpecification.maxPrice !== '')
            //         ? Number(req.query.priceSpecification.maxPrice)
            //         : undefined,
            //     referenceQuantity: {
            //         value: (req.query.priceSpecification !== undefined
            //             && req.query.priceSpecification.referenceQuantity !== undefined
            //             && req.query.priceSpecification.referenceQuantity.value !== undefined
            //             && req.query.priceSpecification.referenceQuantity.value !== '')
            //             ? Number(req.query.priceSpecification.referenceQuantity.value)
            //             : undefined
            //     }
            // },
            // category: {
            //     ids: (req.query.category !== undefined
            //         && req.query.category.id !== undefined
            //         && req.query.category.id !== '')
            //         ? [req.query.category.id]
            //         : undefined
            // }
        };
        const { data } = yield offerService.search(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((t) => {
                return Object.assign(Object.assign({}, t), { eligibleQuantity: {
                        minValue: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleQuantity !== undefined
                            && t.priceSpecification.eligibleQuantity.minValue !== undefined)
                            ? t.priceSpecification.eligibleQuantity.minValue
                            : '--',
                        maxValue: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleQuantity !== undefined
                            && t.priceSpecification.eligibleQuantity.maxValue !== undefined)
                            ? t.priceSpecification.eligibleQuantity.maxValue
                            : '--'
                    }, eligibleTransactionVolume: {
                        price: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleTransactionVolume !== undefined
                            && t.priceSpecification.eligibleTransactionVolume.price !== undefined)
                            ? t.priceSpecification.eligibleTransactionVolume.price
                            : '--',
                        priceCurrency: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleTransactionVolume !== undefined)
                            ? t.priceSpecification.eligibleTransactionVolume.priceCurrency
                            : '--'
                    }, referenceQuantity: {
                        value: (t.priceSpecification !== undefined && t.priceSpecification.referenceQuantity.value !== undefined)
                            ? t.priceSpecification.referenceQuantity.value
                            : '--'
                    } });
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
addOnsRouter.all('/:id/update', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let offer = yield offerService.findById({ id: req.params.id });
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchProductsResult = yield productService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        typeOf: { $eq: 'Product' }
    });
    if (req.method === 'POST') {
        // 検証
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const product = yield productService.findById({ id: req.body.itemOffered.id });
                offer = createFromBody(req, product);
                yield offerService.updateOffer(offer);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                console.error(error);
                message = error.message;
            }
        }
    }
    else if (req.method === 'DELETE') {
        yield offerService.deleteOffer({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
        return;
    }
    const forms = Object.assign(Object.assign({}, offer), req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('addOns/update', {
        message: message,
        errors: errors,
        forms: forms,
        products: searchProductsResult.data
    });
}));
addOnsRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('addOns/index', {
        message: ''
    });
}));
function createFromBody(req, itemOffered) {
    const body = req.body;
    const referenceQuantityValue = Number(body.priceSpecification.referenceQuantity.value);
    const referenceQuantity = {
        typeOf: 'QuantitativeValue',
        value: referenceQuantityValue,
        unitCode: chevre.factory.unitCode.C62
    };
    const priceSpec = {
        project: req.project,
        typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
        name: body.name,
        price: Number(body.priceSpecification.price),
        priceCurrency: chevre.factory.priceCurrency.JPY,
        valueAddedTaxIncluded: true,
        referenceQuantity: referenceQuantity,
        accounting: {
            typeOf: 'Accounting',
            operatingRevenue: {
                project: req.project,
                typeOf: 'AccountTitle',
                codeValue: body.accountTitle,
                name: ''
            },
            accountsReceivable: undefined
        }
    };
    return Object.assign({ typeOf: chevre.factory.offerType.Offer, priceCurrency: chevre.factory.priceCurrency.JPY, id: req.params.id, name: body.name, itemOffered: {
            project: itemOffered.project,
            typeOf: itemOffered.typeOf,
            id: itemOffered.id,
            identifier: itemOffered.identifier,
            name: itemOffered.name
        }, priceSpecification: priceSpec, additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                .map((p) => {
                return {
                    name: String(p.name),
                    value: String(p.value)
                };
            })
            : undefined }, {
        project: req.project,
        identifier: body.identifier
    });
}
const NAME_MAX_LENGTH_CODE = 64;
const NAME_MAX_LENGTH_NAME_JA = 64;
const CHAGE_MAX_LENGTH = 10;
function validate(req) {
    let colName = 'オファーコード';
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = 'アイテム';
    req.checkBody('itemOffered.id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '適用単位';
    req.checkBody('priceSpecification.referenceQuantity.value', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '発生金額';
    req.checkBody('priceSpecification.price').notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .isNumeric()
        .len({ max: CHAGE_MAX_LENGTH })
        .withMessage(Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH));
}
exports.default = addOnsRouter;
