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
 * プロダクトオファー管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const _ = require("underscore");
const Message = require("../common/Const/Message");
const NUM_ADDITIONAL_PROPERTY = 10;
const productOffersRouter = express_1.Router();
productOffersRouter.all('/new', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const offerService = new chevre.service.Offer({
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
                const offer = createFromBody(req);
                yield offerService.createProductOffer(offer);
                req.flash('message', '登録しました');
                res.redirect(`/productOffers/${offer.id}/update`);
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
    res.render('productOffers/new', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
productOffersRouter.all('/:id/update', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchOffersResult = yield offerService.searchProductOffers({ id: req.params.id });
    let offer = searchOffersResult.data.shift();
    if (offer === undefined) {
        throw new Error('Offer Not Found');
    }
    if (req.method === 'POST') {
        // 検証
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                offer = createFromBody(req);
                yield offerService.updateProductOffer(offer);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    if (offer.priceSpecification === undefined) {
        throw new Error('ticketType.priceSpecification undefined');
    }
    let seatReservationUnit = 1;
    if (offer.priceSpecification.referenceQuantity.value !== undefined) {
        seatReservationUnit = offer.priceSpecification.referenceQuantity.value;
    }
    const forms = Object.assign({ additionalProperty: [], alternateName: {}, priceSpecification: {
            referenceQuantity: {}
        }, itemOffered: { name: {} } }, offer, { price: Math.floor(Number(offer.priceSpecification.price) / seatReservationUnit) }, req.body, { seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit });
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('productOffers/update', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
productOffersRouter.get('', (__, res) => __awaiter(this, void 0, void 0, function* () {
    res.render('productOffers/index', {
        message: ''
    });
}));
productOffersRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerIds = [];
        if (req.query.id !== '' && req.query.id !== undefined) {
            offerIds.push(req.query.id);
        }
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            sort: { 'priceSpecification.price': chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] },
            ids: offerIds,
            name: (req.query.name !== undefined
                && req.query.name !== '')
                ? req.query.name
                : undefined,
            priceSpecification: {
                minPrice: (req.query.priceSpecification !== undefined
                    && req.query.priceSpecification.minPrice !== undefined
                    && req.query.priceSpecification.minPrice !== '')
                    ? Number(req.query.priceSpecification.minPrice)
                    : undefined,
                maxPrice: (req.query.priceSpecification !== undefined
                    && req.query.priceSpecification.maxPrice !== undefined
                    && req.query.priceSpecification.maxPrice !== '')
                    ? Number(req.query.priceSpecification.maxPrice)
                    : undefined,
                referenceQuantity: {
                    value: (req.query.priceSpecification !== undefined
                        && req.query.priceSpecification.referenceQuantity !== undefined
                        && req.query.priceSpecification.referenceQuantity.value !== undefined
                        && req.query.priceSpecification.referenceQuantity.value !== '')
                        ? Number(req.query.priceSpecification.referenceQuantity.value)
                        : undefined
                }
            },
            category: {
                ids: (req.query.category !== undefined
                    && req.query.category.id !== undefined
                    && req.query.category.id !== '')
                    ? [req.query.category.id]
                    : undefined
            }
        };
        const result = yield offerService.searchProductOffers(searchConditions);
        res.json({
            success: true,
            count: result.totalCount,
            results: result.data.map((t) => {
                return Object.assign({}, t, { eligibleQuantity: {
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
function createFromBody(req) {
    const body = req.body;
    const referenceQuantityValue = Number(body.seatReservationUnit);
    const referenceQuantity = {
        typeOf: 'QuantitativeValue',
        value: referenceQuantityValue,
        unitCode: chevre.factory.unitCode.C62
    };
    return {
        project: req.project,
        typeOf: 'Offer',
        priceCurrency: chevre.factory.priceCurrency.JPY,
        id: body.id,
        identifier: body.identifier,
        name: body.name,
        description: body.description,
        alternateName: { ja: body.alternateName.ja, en: '' },
        itemOffered: {
            typeOf: 'Product',
            name: body.itemOffered.name
        },
        priceSpecification: {
            project: req.project,
            typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
            price: Number(body.price) * referenceQuantityValue,
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
                accountsReceivable: Number(body.price) * referenceQuantityValue
            }
        },
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                .map((p) => {
                return {
                    name: String(p.name),
                    value: String(p.value)
                };
            })
            : undefined,
        category: {
            id: body.category
        }
    };
}
const NAME_MAX_LENGTH_CODE = 64;
const NAME_MAX_LENGTH_NAME_JA = 64;
const NAME_MAX_LENGTH_NAME_EN = 64;
const CHAGE_MAX_LENGTH = 10;
function validate(req) {
    let colName = 'ID';
    req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('id', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = 'English Name';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.en', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    colName = '代替名称';
    req.checkBody('alternateName.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('alternateName.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = 'アイテム名称';
    req.checkBody('itemOffered.name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = 'アイテム英語名称';
    req.checkBody('itemOffered.name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '適用単位';
    req.checkBody('seatReservationUnit', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '発生金額';
    req.checkBody('price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('price', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
}
exports.default = productOffersRouter;
