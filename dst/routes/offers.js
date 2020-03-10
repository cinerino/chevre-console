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
 * オファー管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const NUM_ADDITIONAL_PROPERTY = 10;
// コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;
const offersRouter = express_1.Router();
offersRouter.all('/add', 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
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
            // 登録プロセス
            try {
                req.body.id = '';
                let offer = yield createFromBody(req, true);
                // コード重複確認
                const { data } = yield offerService.searchTicketTypes({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: offer.identifier }
                });
                if (data.length > 0) {
                    throw new Error(`既に存在するコードです: ${offer.identifier}`);
                }
                // コード重複確認
                const searchOffersResult = yield offerService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: offer.identifier }
                });
                if (searchOffersResult.data.length > 0) {
                    throw new Error(`既に存在するコードです: ${offer.identifier}`);
                }
                offer = yield offerService.create(offer);
                req.flash('message', '登録しました');
                res.redirect(`/offers/${offer.id}/update`);
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
        }, isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? '' : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? '' : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    const searchOfferCategoryTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
    });
    const searchAccountTitlesResult = yield accountTitleService.search({
        project: { ids: [req.project.id] }
    });
    res.render('offers/add', {
        message: message,
        errors: errors,
        forms: forms,
        ticketTypeCategories: searchOfferCategoryTypesResult.data,
        accountTitles: searchAccountTitlesResult.data,
        productTypes: productType_1.productTypes
    });
}));
offersRouter.all('/:id/update', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let message = '';
    let errors = {};
    const itemOfferedTypeOf = (_a = req.query.itemOffered) === null || _a === void 0 ? void 0 : _a.typeOf;
    if (itemOfferedTypeOf === productType_1.ProductType.EventService) {
        res.redirect(`/ticketTypes/${req.params.id}/update`);
        return;
    }
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchAccountTitlesResult = yield accountTitleService.search({
        project: { ids: [req.project.id] }
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        let offer = yield offerService.findById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = req.params.id;
                    offer = yield createFromBody(req, false);
                    yield offerService.updateOffer(offer);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign({}, offer), req.body);
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }
        const searchOfferCategoryTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });
        res.render('offers/update', {
            message: message,
            errors: errors,
            forms: forms,
            ticketTypeCategories: searchOfferCategoryTypesResult.data,
            accountTitles: searchAccountTitlesResult.data,
            productTypes: productType_1.productTypes
        });
    }
    catch (error) {
        next(error);
    }
}));
offersRouter.get('/:id/catalogs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = 100;
        const page = 1;
        const { data } = yield offerCatalogService.search({
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            itemListElement: {
                id: { $in: [req.params.id] }
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
    catch (err) {
        res.json({
            success: false,
            message: err.message,
            count: 0,
            results: []
        });
    }
}));
offersRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchOfferCategoryTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
    });
    // 券種マスタ画面遷移
    res.render('offers/index', {
        message: '',
        ticketTypeCategories: searchOfferCategoryTypesResult.data,
        productTypes: productType_1.productTypes
    });
}));
offersRouter.get('/getlist', 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f;
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchOfferCategoryTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });
        const offerCategoryTypes = searchOfferCategoryTypesResult.data;
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const searchConditions = {
            limit: limit,
            page: page,
            sort: { 'priceSpecification.price': chevre.factory.sortType.Ascending },
            project: { id: { $eq: req.project.id } },
            itemOffered: {
                typeOf: {
                    $eq: (typeof ((_b = req.query.itemOffered) === null || _b === void 0 ? void 0 : _b.typeOf) === 'string' && ((_c = req.query.itemOffered) === null || _c === void 0 ? void 0 : _c.typeOf.length) > 0)
                        ? (_d = req.query.itemOffered) === null || _d === void 0 ? void 0 : _d.typeOf : undefined
                }
            },
            identifier: (req.query.identifier !== '' && req.query.identifier !== undefined) ? req.query.identifier : undefined,
            id: (typeof req.query.id === 'string' && req.query.id.length > 0) ? { $eq: req.query.id } : undefined,
            name: (req.query.name !== undefined
                && req.query.name !== '')
                ? { $regex: req.query.name }
                : undefined,
            priceSpecification: {
                price: {
                    $gte: (req.query.priceSpecification !== undefined
                        && req.query.priceSpecification.minPrice !== undefined
                        && req.query.priceSpecification.minPrice !== '')
                        ? Number(req.query.priceSpecification.minPrice)
                        : undefined,
                    $lte: (req.query.priceSpecification !== undefined
                        && req.query.priceSpecification.maxPrice !== undefined
                        && req.query.priceSpecification.maxPrice !== '')
                        ? Number(req.query.priceSpecification.maxPrice)
                        : undefined
                },
                referenceQuantity: {
                    value: {
                        $eq: (req.query.priceSpecification !== undefined
                            && req.query.priceSpecification.referenceQuantity !== undefined
                            && req.query.priceSpecification.referenceQuantity.value !== undefined
                            && req.query.priceSpecification.referenceQuantity.value !== '')
                            ? Number(req.query.priceSpecification.referenceQuantity.value)
                            : undefined
                    }
                }
            },
            category: {
                codeValue: (req.query.category !== undefined
                    && typeof req.query.category.codeValue === 'string'
                    && req.query.category.codeValue !== '')
                    ? { $in: [req.query.category.codeValue] }
                    : undefined
            }
        };
        let data;
        if (((_f = (_e = searchConditions.itemOffered) === null || _e === void 0 ? void 0 : _e.typeOf) === null || _f === void 0 ? void 0 : _f.$eq) === productType_1.ProductType.EventService) {
            const searchResult = yield offerService.searchTicketTypes(searchConditions);
            data = searchResult.data;
        }
        else {
            const searchResult = yield offerService.search(searchConditions);
            data = searchResult.data;
        }
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            // tslint:disable-next-line:cyclomatic-complexity
            results: data.map((t) => {
                var _a, _b, _c;
                const categoryCode = (_a = t.category) === null || _a === void 0 ? void 0 : _a.codeValue;
                const productType = productType_1.productTypes.find((p) => p.codeValue === t.itemOffered.typeOf);
                return Object.assign(Object.assign(Object.assign({}, t), (productType !== undefined) ? { itemOfferedName: productType.name } : undefined), { categoryName: (typeof categoryCode === 'string')
                        ? (_c = (_b = offerCategoryTypes.find((c) => c.codeValue === categoryCode)) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.ja : '', validRateLimitStr: (t.validRateLimit !== undefined && t.validRateLimit !== null)
                        ? `1 ${t.validRateLimit.scope} / ${t.validRateLimit.unitInSeconds} s`
                        : '', addOnCount: (Array.isArray(t.addOn))
                        ? t.addOn.length
                        : 0 });
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
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req, isNew) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let offerCategory;
        if (typeof ((_a = body.category) === null || _a === void 0 ? void 0 : _a.codeValue) === 'string' && ((_b = body.category) === null || _b === void 0 ? void 0 : _b.codeValue.length) > 0) {
            const searchOfferCategoryTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } },
                codeValue: { $eq: (_c = body.category) === null || _c === void 0 ? void 0 : _c.codeValue }
            });
            if (searchOfferCategoryTypesResult.data.length === 0) {
                throw new Error('オファーカテゴリーが見つかりません');
            }
            offerCategory = searchOfferCategoryTypesResult.data[0];
        }
        const availability = chevre.factory.itemAvailability.InStock;
        const referenceQuantityValue = Number(body.priceSpecification.referenceQuantity.value);
        const referenceQuantity = {
            typeOf: 'QuantitativeValue',
            value: referenceQuantityValue,
            unitCode: body.priceSpecification.referenceQuantity.unitCode
        };
        const eligibleQuantityMinValue = (body.priceSpecification !== undefined
            && body.priceSpecification.eligibleQuantity !== undefined
            && body.priceSpecification.eligibleQuantity.minValue !== undefined
            && body.priceSpecification.eligibleQuantity.minValue !== '')
            ? Number(body.priceSpecification.eligibleQuantity.minValue)
            : undefined;
        const eligibleQuantityMaxValue = (body.priceSpecification !== undefined
            && body.priceSpecification.eligibleQuantity !== undefined
            && body.priceSpecification.eligibleQuantity.maxValue !== undefined
            && body.priceSpecification.eligibleQuantity.maxValue !== '')
            ? Number(body.priceSpecification.eligibleQuantity.maxValue)
            : undefined;
        const eligibleQuantity = (eligibleQuantityMinValue !== undefined || eligibleQuantityMaxValue !== undefined)
            ? {
                typeOf: 'QuantitativeValue',
                minValue: eligibleQuantityMinValue,
                maxValue: eligibleQuantityMaxValue,
                unitCode: chevre.factory.unitCode.C62
            }
            : undefined;
        const eligibleTransactionVolumePrice = (body.priceSpecification !== undefined
            && body.priceSpecification.eligibleTransactionVolume !== undefined
            && body.priceSpecification.eligibleTransactionVolume.price !== undefined
            && body.priceSpecification.eligibleTransactionVolume.price !== '')
            ? Number(body.priceSpecification.eligibleTransactionVolume.price)
            : undefined;
        // tslint:disable-next-line:max-line-length
        const eligibleTransactionVolume = (eligibleTransactionVolumePrice !== undefined)
            ? {
                project: req.project,
                typeOf: chevre.factory.priceSpecificationType.PriceSpecification,
                price: eligibleTransactionVolumePrice,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true
            }
            : undefined;
        const accounting = {
            typeOf: 'Accounting',
            operatingRevenue: undefined,
            accountsReceivable: Number(body.priceSpecification.price) // とりあえず発生金額に同じ
        };
        if (body.accountTitle !== undefined && body.accountTitle !== '') {
            accounting.operatingRevenue = {
                typeOf: 'AccountTitle',
                codeValue: body.accountTitle,
                identifier: body.accountTitle,
                name: ''
            };
        }
        let nameFromJson = {};
        if (typeof body.nameStr === 'string' && body.nameStr.length > 0) {
            try {
                nameFromJson = JSON.parse(body.nameStr);
            }
            catch (error) {
                throw new Error(`高度な名称の型が不適切です ${error.message}`);
            }
        }
        let validFrom;
        if (typeof req.body.validFrom === 'string' && req.body.validFrom.length > 0) {
            validFrom = moment(`${req.body.validFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate();
            // validFrom = moment(req.body.validFrom)
            //     .toDate();
        }
        let validThrough;
        if (typeof req.body.validThrough === 'string' && req.body.validThrough.length > 0) {
            validThrough = moment(`${req.body.validThrough}T23:59:59+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate();
            // validThrough = moment(req.body.validThrough)
            //     .toDate();
        }
        const priceSpec = {
            project: req.project,
            typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
            name: body.name,
            price: Number(body.priceSpecification.price),
            priceCurrency: chevre.factory.priceCurrency.JPY,
            valueAddedTaxIncluded: true,
            referenceQuantity: referenceQuantity,
            accounting: accounting,
            eligibleQuantity: eligibleQuantity,
            eligibleTransactionVolume: eligibleTransactionVolume
        };
        let itemOffered;
        const itemOfferedTypeOf = (_d = body.itemOffered) === null || _d === void 0 ? void 0 : _d.typeOf;
        switch (itemOfferedTypeOf) {
            case productType_1.ProductType.Product:
                itemOffered = {
                    project: req.project,
                    typeOf: itemOfferedTypeOf
                };
                break;
            case productType_1.ProductType.MembershipService:
                itemOffered = {
                    project: req.project,
                    typeOf: itemOfferedTypeOf,
                    serviceOutput: { typeOf: chevre.factory.programMembership.ProgramMembershipType.ProgramMembership }
                };
                break;
            default:
                throw new Error(`${(_e = body.itemOffered) === null || _e === void 0 ? void 0 : _e.typeOf} not implemented`);
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({ project: req.project, typeOf: chevre.factory.offerType.Offer, priceCurrency: chevre.factory.priceCurrency.JPY, id: body.id, identifier: req.body.identifier, name: Object.assign(Object.assign({}, nameFromJson), { ja: body.name.ja, en: body.name.en }), description: body.description, alternateName: { ja: body.alternateName.ja, en: '' }, availability: availability, itemOffered: itemOffered, 
            // eligibleCustomerType: eligibleCustomerType,
            priceSpecification: priceSpec, additionalProperty: (Array.isArray(body.additionalProperty))
                ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined }, (offerCategory !== undefined)
            ? {
                category: {
                    project: offerCategory.project,
                    id: offerCategory.id,
                    codeValue: offerCategory.codeValue
                }
            }
            : undefined), (validFrom instanceof Date)
            ? {
                validFrom: validFrom
            }
            : undefined), (validThrough instanceof Date)
            ? {
                validThrough: validThrough
            }
            : undefined), (!isNew)
            ? {
                $unset: Object.assign(Object.assign(Object.assign({}, (offerCategory === undefined) ? { category: 1 } : undefined), (validFrom === undefined) ? { validFrom: 1 } : undefined), (validThrough === undefined) ? { validThrough: 1 } : undefined)
            }
            : undefined);
    });
}
function validate(req) {
    let colName = 'コード';
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    colName = '名称';
    req.checkBody('name.ja')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_NAME_JA })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));
    colName = '代替名称';
    req.checkBody('alternateName.ja')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_NAME_JA })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA));
    colName = '適用数';
    req.checkBody('priceSpecification.referenceQuantity.value')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));
    colName = '適用単位';
    req.checkBody('priceSpecification.referenceQuantity.unitCode')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));
    colName = '発生金額';
    req.checkBody('priceSpecification.price')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .isNumeric()
        .len({ max: CHAGE_MAX_LENGTH })
        .withMessage(Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH));
}
exports.default = offersRouter;
