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
 * 販売者ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const cinerino = require("@cinerino/sdk");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const NUM_ADDITIONAL_PROPERTY = 10;
// コード 半角64
const NAME_MAX_LENGTH_CODE = 30;
// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;
const sellersRouter = express_1.Router();
sellersRouter.all('/add', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let message = '';
    let errors = {};
    const itemOfferedTypeOf = (_a = req.query.itemOffered) === null || _a === void 0 ? void 0 : _a.typeOf;
    if (itemOfferedTypeOf === productType_1.ProductType.EventService) {
        res.redirect(`/ticketTypes/add`);
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
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const iamService = new cinerino.service.IAM({
        endpoint: process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    if (req.method === 'POST') {
        // 検証
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        // 検証
        if (validatorResult.isEmpty()) {
            // 登録プロセス
            try {
                req.body.id = '';
                let offer = yield createFromBody(req, true);
                // コード重複確認
                const searchOffersResult = yield offerService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: offer.identifier }
                });
                if (searchOffersResult.data.length > 0) {
                    throw new Error('既に存在するコードです');
                }
                offer = yield offerService.create(offer);
                req.flash('message', '登録しました');
                res.redirect(`/sellers/${offer.id}/update`);
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
    const searchApplicationsResult = yield iamService.searchMembers({
        member: { typeOf: { $eq: cinerino.factory.creativeWorkType.WebApplication } }
    });
    res.render('sellers/add', {
        message: message,
        errors: errors,
        forms: forms,
        ticketTypeCategories: searchOfferCategoryTypesResult.data,
        accountTitles: searchAccountTitlesResult.data,
        productTypes: productType_1.productTypes,
        applications: searchApplicationsResult.data.map((d) => d.member)
            .sort((a, b) => {
            if (String(a.name) < String(b.name)) {
                return -1;
            }
            if (String(a.name) > String(b.name)) {
                return 1;
            }
            return 0;
        })
    });
}));
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.all('/:id/update', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    let message = '';
    let errors = {};
    const itemOfferedTypeOf = (_b = req.query.itemOffered) === null || _b === void 0 ? void 0 : _b.typeOf;
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
    const iamService = new cinerino.service.IAM({
        endpoint: process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    try {
        let offer = yield offerService.findById({ id: req.params.id });
        if (((_c = offer.itemOffered) === null || _c === void 0 ? void 0 : _c.typeOf) === productType_1.ProductType.EventService) {
            res.redirect(`/ticketTypes/${req.params.id}/update`);
            return;
        }
        if (req.method === 'POST') {
            // 検証
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            // 検証
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = req.params.id;
                    offer = yield createFromBody(req, false);
                    yield offerService.update(offer);
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
        const searchApplicationsResult = yield iamService.searchMembers({
            member: { typeOf: { $eq: cinerino.factory.creativeWorkType.WebApplication } }
        });
        res.render('sellers/update', {
            message: message,
            errors: errors,
            forms: forms,
            ticketTypeCategories: searchOfferCategoryTypesResult.data,
            accountTitles: searchAccountTitlesResult.data,
            productTypes: productType_1.productTypes,
            applications: searchApplicationsResult.data.map((d) => d.member)
                .sort((a, b) => {
                if (String(a.name) < String(b.name)) {
                    return -1;
                }
                if (String(a.name) > String(b.name)) {
                    return 1;
                }
                return 0;
            })
        });
    }
    catch (error) {
        next(error);
    }
}));
sellersRouter.get('/:id/catalogs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
sellersRouter.get('/:id/availableApplications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const iamService = new cinerino.service.IAM({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        let data = [];
        const offer = yield offerService.findById({ id: req.params.id });
        if (Array.isArray(offer.availableAtOrFrom) && offer.availableAtOrFrom.length > 0) {
            const searchApplicationsResult = yield iamService.searchMembers({
                member: {
                    typeOf: { $eq: cinerino.factory.creativeWorkType.WebApplication },
                    id: { $in: offer.availableAtOrFrom.map((a) => a.id) }
                }
            });
            data = searchApplicationsResult.data.map((m) => m.member);
        }
        res.json({
            success: true,
            count: data.length,
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
sellersRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    res.render('sellers/index', {
        message: '',
        ticketTypeCategories: searchOfferCategoryTypesResult.data,
        productTypes: productType_1.productTypes
    });
}));
sellersRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerService = new chevre.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        // const identifierRegex = req.query.identifier;
        const searchConditions = {
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } }
            // identifier: {
            //     $regex: (typeof identifierRegex === 'string' && identifierRegex.length > 0) ? identifierRegex : undefined
            // },
            // id: (typeof req.query.id === 'string' && req.query.id.length > 0) ? { $eq: req.query.id } : undefined
        };
        let data;
        const searchResult = yield sellerService.search(searchConditions);
        data = searchResult.data;
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((t) => {
                return Object.assign(Object.assign({}, t), { paymentAcceptedCount: (Array.isArray(t.paymentAccepted))
                        ? t.paymentAccepted.length
                        : 0, hasMerchantReturnPolicyCount: (Array.isArray(t.hasMerchantReturnPolicy))
                        ? t.hasMerchantReturnPolicy.length
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
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let offerCategory;
        if (typeof ((_a = req.body.category) === null || _a === void 0 ? void 0 : _a.codeValue) === 'string' && ((_b = req.body.category) === null || _b === void 0 ? void 0 : _b.codeValue.length) > 0) {
            const searchOfferCategoryTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } },
                codeValue: { $eq: (_c = req.body.category) === null || _c === void 0 ? void 0 : _c.codeValue }
            });
            if (searchOfferCategoryTypesResult.data.length === 0) {
                throw new Error('オファーカテゴリーが見つかりません');
            }
            offerCategory = searchOfferCategoryTypesResult.data[0];
        }
        const availability = chevre.factory.itemAvailability.InStock;
        const referenceQuantityValue = Number(req.body.priceSpecification.referenceQuantity.value);
        const referenceQuantity = {
            typeOf: 'QuantitativeValue',
            value: referenceQuantityValue,
            unitCode: req.body.priceSpecification.referenceQuantity.unitCode
        };
        const eligibleQuantityMinValue = (req.body.priceSpecification !== undefined
            && req.body.priceSpecification.eligibleQuantity !== undefined
            && req.body.priceSpecification.eligibleQuantity.minValue !== undefined
            && req.body.priceSpecification.eligibleQuantity.minValue !== '')
            ? Number(req.body.priceSpecification.eligibleQuantity.minValue)
            : undefined;
        const eligibleQuantityMaxValue = (req.body.priceSpecification !== undefined
            && req.body.priceSpecification.eligibleQuantity !== undefined
            && req.body.priceSpecification.eligibleQuantity.maxValue !== undefined
            && req.body.priceSpecification.eligibleQuantity.maxValue !== '')
            ? Number(req.body.priceSpecification.eligibleQuantity.maxValue)
            : undefined;
        const eligibleQuantity = (eligibleQuantityMinValue !== undefined || eligibleQuantityMaxValue !== undefined)
            ? {
                typeOf: 'QuantitativeValue',
                minValue: eligibleQuantityMinValue,
                maxValue: eligibleQuantityMaxValue,
                unitCode: chevre.factory.unitCode.C62
            }
            : undefined;
        const eligibleTransactionVolumePrice = (req.body.priceSpecification !== undefined
            && req.body.priceSpecification.eligibleTransactionVolume !== undefined
            && req.body.priceSpecification.eligibleTransactionVolume.price !== undefined
            && req.body.priceSpecification.eligibleTransactionVolume.price !== '')
            ? Number(req.body.priceSpecification.eligibleTransactionVolume.price)
            : undefined;
        // tslint:disable-next-line:max-line-length
        const eligibleTransactionVolume = (eligibleTransactionVolumePrice !== undefined)
            ? {
                project: { typeOf: req.project.typeOf, id: req.project.id },
                typeOf: chevre.factory.priceSpecificationType.PriceSpecification,
                price: eligibleTransactionVolumePrice,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true
            }
            : undefined;
        const accounting = {
            typeOf: 'Accounting',
            operatingRevenue: undefined,
            accountsReceivable: Number(req.body.priceSpecification.price) // とりあえず発生金額に同じ
        };
        if (req.body.accountTitle !== undefined && req.body.accountTitle !== '') {
            accounting.operatingRevenue = {
                typeOf: 'AccountTitle',
                codeValue: req.body.accountTitle,
                identifier: req.body.accountTitle,
                name: ''
            };
        }
        let nameFromJson = {};
        if (typeof req.body.nameStr === 'string' && req.body.nameStr.length > 0) {
            try {
                nameFromJson = JSON.parse(req.body.nameStr);
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
            project: { typeOf: req.project.typeOf, id: req.project.id },
            typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
            name: req.body.name,
            price: Number(req.body.priceSpecification.price),
            priceCurrency: chevre.factory.priceCurrency.JPY,
            valueAddedTaxIncluded: true,
            referenceQuantity: referenceQuantity,
            accounting: accounting,
            eligibleQuantity: eligibleQuantity,
            eligibleTransactionVolume: eligibleTransactionVolume
        };
        let itemOffered;
        const itemOfferedTypeOf = (_d = req.body.itemOffered) === null || _d === void 0 ? void 0 : _d.typeOf;
        switch (itemOfferedTypeOf) {
            case productType_1.ProductType.Account:
            case productType_1.ProductType.Product:
                itemOffered = {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: itemOfferedTypeOf
                };
                break;
            case productType_1.ProductType.MembershipService:
                itemOffered = {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: itemOfferedTypeOf,
                    serviceOutput: {
                        project: { typeOf: req.project.typeOf, id: req.project.id },
                        typeOf: chevre.factory.programMembership.ProgramMembershipType.ProgramMembership
                    }
                };
                break;
            default:
                throw new Error(`${(_e = req.body.itemOffered) === null || _e === void 0 ? void 0 : _e.typeOf} not implemented`);
        }
        let pointAward;
        if (typeof req.body.pointAwardStr === 'string' && req.body.pointAwardStr.length > 0) {
            try {
                pointAward = JSON.parse(req.body.pointAwardStr);
            }
            catch (error) {
                throw new Error(`invalid pointAward ${error.message}`);
            }
        }
        if (pointAward !== undefined) {
            itemOffered.pointAward = pointAward;
        }
        // 利用可能なアプリケーション設定
        const availableAtOrFrom = [];
        const availableAtOrFromParams = (_f = req.body.availableAtOrFrom) === null || _f === void 0 ? void 0 : _f.id;
        if (Array.isArray(availableAtOrFromParams)) {
            availableAtOrFromParams.forEach((applicationId) => {
                if (typeof applicationId === 'string' && applicationId.length > 0) {
                    availableAtOrFrom.push({ id: applicationId });
                }
            });
        }
        else if (typeof availableAtOrFromParams === 'string' && availableAtOrFromParams.length > 0) {
            availableAtOrFrom.push({ id: availableAtOrFromParams });
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: chevre.factory.offerType.Offer, priceCurrency: chevre.factory.priceCurrency.JPY, id: req.body.id, identifier: req.body.identifier, name: Object.assign(Object.assign({}, nameFromJson), { ja: req.body.name.ja, en: req.body.name.en }), description: req.body.description, alternateName: { ja: req.body.alternateName.ja, en: '' }, availability: availability, availableAtOrFrom: availableAtOrFrom, itemOffered: itemOffered, 
            // eligibleCustomerType: eligibleCustomerType,
            priceSpecification: priceSpec, additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
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
function validate() {
    return [
        express_validator_1.body('identifier', Message.Common.required.replace('$fieldName$', 'コード'))
            .notEmpty()
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLengthHalfByte('コード', NAME_MAX_LENGTH_CODE))
            .matches(/^[0-9a-zA-Z\-_]+$/)
            .withMessage(() => '英数字で入力してください'),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA })
            .withMessage(Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_CODE)),
        express_validator_1.body('alternateName.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '代替名称'))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA })
            .withMessage(Message.Common.getMaxLength('代替名称', NAME_MAX_LENGTH_NAME_JA)),
        express_validator_1.body('priceSpecification.referenceQuantity.value')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '適用数')),
        express_validator_1.body('priceSpecification.referenceQuantity.unitCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '適用単位')),
        express_validator_1.body('priceSpecification.price')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '発生金額'))
            .isNumeric()
            .isLength({ max: CHAGE_MAX_LENGTH })
            .withMessage(Message.Common.getMaxLengthHalfByte('発生金額', CHAGE_MAX_LENGTH))
    ];
}
exports.default = sellersRouter;
