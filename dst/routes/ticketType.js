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
 * 券種管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const NUM_ADDITIONAL_PROPERTY = 10;
// 券種コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 券種名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;
const ticketTypeMasterRouter = express_1.Router();
// 券種登録
ticketTypeMasterRouter.all('/add', ...validateFormAdd(), 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
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
            // DB登録プロセス
            try {
                req.body.id = '';
                let ticketType = yield createFromBody(req, true);
                // コード重複確認
                const { data } = yield offerService.search({
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: ticketType.identifier }
                });
                if (data.length > 0) {
                    throw new Error(`既に存在するコードです: ${ticketType.identifier}`);
                }
                ticketType = yield offerService.create(ticketType);
                req.flash('message', '登録しました');
                res.redirect(`/ticketTypes/${ticketType.id}/update`);
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
    // ムビチケ券種区分検索
    const searchMovieTicketTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
    });
    // 座席区分検索
    const searchSeatingTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
    });
    // 口座タイプ検索
    const searchAccountTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.AccountType } }
    });
    const accountTitles = yield searchAllAccountTitles(req);
    const searchAddOnsResult = yield productService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        typeOf: { $eq: productType_1.ProductType.Product }
    });
    res.render('ticketType/add', {
        message: message,
        errors: errors,
        forms: forms,
        movieTicketTypes: searchMovieTicketTypesResult.data,
        seatingTypes: searchSeatingTypesResult.data,
        accountTypes: searchAccountTypesResult.data,
        ticketTypeCategories: searchOfferCategoryTypesResult.data,
        accountTitles: accountTitles,
        addOns: searchAddOnsResult.data
    });
}));
// 券種編集
ticketTypeMasterRouter.all('/:id/update', ...validateFormAdd(), 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        let ticketType = yield offerService.findById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            console.error(errors);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB更新プロセス
                try {
                    req.body.id = req.params.id;
                    ticketType = yield createFromBody(req, false);
                    yield offerService.update(ticketType);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        if (ticketType.priceSpecification === undefined) {
            throw new Error('ticketType.priceSpecification undefined');
        }
        let isBoxTicket = false;
        let isOnlineTicket = false;
        switch (ticketType.availability) {
            case chevre.factory.itemAvailability.InStock:
                isBoxTicket = true;
                isOnlineTicket = true;
                break;
            case chevre.factory.itemAvailability.InStoreOnly:
                isBoxTicket = true;
                break;
            case chevre.factory.itemAvailability.OnlineOnly:
                isOnlineTicket = true;
                break;
            default:
        }
        let seatReservationUnit = 1;
        if (ticketType.priceSpecification.referenceQuantity.value !== undefined) {
            seatReservationUnit = ticketType.priceSpecification.referenceQuantity.value;
        }
        const accountsReceivable = (ticketType.priceSpecification.accounting !== undefined)
            ? ticketType.priceSpecification.accounting.accountsReceivable
            : '';
        const forms = Object.assign(Object.assign(Object.assign(Object.assign({ additionalProperty: [], alternateName: {}, priceSpecification: {
                referenceQuantity: {}
            } }, ticketType), { category: (ticketType.category !== undefined) ? ticketType.category.codeValue : '', price: Math.floor(Number(ticketType.priceSpecification.price) / seatReservationUnit), accountsReceivable: Math.floor(Number(accountsReceivable) / seatReservationUnit), validFrom: (ticketType.validFrom !== undefined)
                ? moment(ticketType.validFrom)
                    .tz('Asia/Tokyo')
                    .format('YYYY/MM/DD')
                : '', validThrough: (ticketType.validThrough !== undefined)
                ? moment(ticketType.validThrough)
                    .tz('Asia/Tokyo')
                    .format('YYYY/MM/DD')
                : '' }), req.body), { isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit, accountTitle: (_.isEmpty(req.body.accountTitle))
                ? (ticketType.priceSpecification.accounting !== undefined
                    && ticketType.priceSpecification.accounting.operatingRevenue !== undefined)
                    ? ticketType.priceSpecification.accounting.operatingRevenue.codeValue : undefined
                : req.body.accountTitle });
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
        // ムビチケ券種区分検索
        const searchMovieTicketTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });
        // 座席区分検索
        const searchSeatingTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });
        // 口座タイプ検索
        const searchAccountTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.AccountType } }
        });
        const searchAddOnsResult = yield productService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            typeOf: { $eq: productType_1.ProductType.Product }
        });
        const accountTitles = yield searchAllAccountTitles(req);
        res.render('ticketType/update', {
            message: message,
            errors: errors,
            forms: forms,
            movieTicketTypes: searchMovieTicketTypesResult.data,
            seatingTypes: searchSeatingTypesResult.data,
            accountTypes: searchAccountTypesResult.data,
            ticketTypeCategories: searchOfferCategoryTypesResult.data,
            accountTitles: accountTitles,
            addOns: searchAddOnsResult.data
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * COA券種インポート
 */
ticketTypeMasterRouter.post('/importFromCOA', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // インポート対象の劇場ブランチコードを検索
        const { data } = yield placeService.searchMovieTheaters({ limit: 100 });
        // タスク作成
        const taskAttributes = data.map((d) => {
            return {
                project: req.project,
                name: chevre.factory.taskName.ImportOffersFromCOA,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 1,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    theaterCode: d.branchCode
                }
            };
        });
        const tasks = yield Promise.all(taskAttributes.map((a) => __awaiter(void 0, void 0, void 0, function* () {
            return taskService.create(a);
        })));
        res.status(http_status_1.CREATED)
            .json(tasks);
    }
    catch (error) {
        next(error);
    }
}));
function searchAllAccountTitles(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = 100;
        let page = 0;
        let numData = limit;
        const accountTitles = [];
        while (numData === limit) {
            page += 1;
            const searchAccountTitlesResult = yield accountTitleService.search({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] }
            });
            numData = searchAccountTitlesResult.data.length;
            accountTitles.push(...searchAccountTitlesResult.data);
        }
        return accountTitles;
    });
}
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req, isNew) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let offerCategory;
        if (typeof req.body.category === 'string' && req.body.category.length > 0) {
            const searchOfferCategoryTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } },
                codeValue: { $eq: req.body.category }
            });
            if (searchOfferCategoryTypesResult.data.length === 0) {
                throw new Error('オファーカテゴリーが見つかりません');
            }
            offerCategory = searchOfferCategoryTypesResult.data[0];
        }
        const availableAddOn = [];
        let addOnItemOfferedIds = (_b = (_a = req.body.addOn) === null || _a === void 0 ? void 0 : _a.itemOffered) === null || _b === void 0 ? void 0 : _b.id;
        if (typeof addOnItemOfferedIds === 'string') {
            addOnItemOfferedIds = [addOnItemOfferedIds];
        }
        if (Array.isArray(addOnItemOfferedIds)) {
            for (const addOnItemOfferedId of addOnItemOfferedIds) {
                const addOn = yield productService.findById({
                    id: addOnItemOfferedId
                });
                if (addOn.hasOfferCatalog === undefined) {
                    throw new Error(`アドオン '${addOn.name.ja}' にはオファーカタログが登録されていません`);
                }
                availableAddOn.push({
                    project: addOn.project,
                    typeOf: chevre.factory.offerType.Offer,
                    itemOffered: {
                        typeOf: addOn.typeOf,
                        id: addOn.id,
                        name: addOn.name
                    },
                    priceCurrency: chevre.factory.priceCurrency.JPY
                });
            }
        }
        let availability = chevre.factory.itemAvailability.OutOfStock;
        if (req.body.isBoxTicket === '1' && req.body.isOnlineTicket === '1') {
            availability = chevre.factory.itemAvailability.InStock;
        }
        else if (req.body.isBoxTicket === '1') {
            availability = chevre.factory.itemAvailability.InStoreOnly;
        }
        else if (req.body.isOnlineTicket === '1') {
            availability = chevre.factory.itemAvailability.OnlineOnly;
        }
        const referenceQuantityValue = Number(req.body.seatReservationUnit);
        const referenceQuantity = {
            typeOf: 'QuantitativeValue',
            value: referenceQuantityValue,
            unitCode: chevre.factory.unitCode.C62
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
                project: req.project,
                typeOf: chevre.factory.priceSpecificationType.PriceSpecification,
                price: eligibleTransactionVolumePrice,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true
            }
            : undefined;
        const appliesToMovieTicketType = (typeof req.body.appliesToMovieTicketType === 'string' && req.body.appliesToMovieTicketType.length > 0)
            ? req.body.appliesToMovieTicketType
            : undefined;
        // const eligibleCustomerType: string[] | undefined = (body.eligibleCustomerType !== undefined && body.eligibleCustomerType !== '')
        //     ? [body.eligibleCustomerType]
        //     : undefined;
        const accounting = {
            typeOf: 'Accounting',
            operatingRevenue: undefined,
            accountsReceivable: Number(req.body.accountsReceivable) * referenceQuantityValue
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
        // 適用座席区分があれば設定
        let eligibleSeatingTypes;
        if (Array.isArray(req.body.eligibleSeatingType) && req.body.eligibleSeatingType.length > 0
            && typeof req.body.eligibleSeatingType[0].id === 'string' && req.body.eligibleSeatingType[0].id.length > 0) {
            const searchSeatingTypeResult = yield categoryCodeService.search({
                limit: 1,
                id: { $eq: req.body.eligibleSeatingType[0].id },
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
            });
            const seatingType = searchSeatingTypeResult.data.shift();
            if (seatingType === undefined) {
                throw new Error(`Seating Type ${req.body.eligibleSeatingType[0].id} Not Found`);
            }
            eligibleSeatingTypes = [{
                    project: seatingType.project,
                    typeOf: seatingType.typeOf,
                    id: seatingType.id,
                    codeValue: seatingType.codeValue,
                    inCodeSet: seatingType.inCodeSet
                }];
        }
        // 適用口座があれば設定
        let eligibleMonetaryAmount;
        if (Array.isArray(req.body.eligibleMonetaryAmount) && req.body.eligibleMonetaryAmount.length > 0
            && typeof req.body.eligibleMonetaryAmount[0].currency === 'string' && req.body.eligibleMonetaryAmount[0].currency.length > 0
            && typeof req.body.eligibleMonetaryAmount[0].value === 'string' && req.body.eligibleMonetaryAmount[0].value.length > 0) {
            eligibleMonetaryAmount = [{
                    typeOf: 'MonetaryAmount',
                    currency: req.body.eligibleMonetaryAmount[0].currency,
                    value: Number(req.body.eligibleMonetaryAmount[0].value)
                }];
        }
        // 適用サブ予約条件があれば設定
        let eligibleSubReservation;
        if (Array.isArray(req.body.eligibleSubReservation) && req.body.eligibleSubReservation.length > 0
            && typeof req.body.eligibleSubReservation[0].typeOfGood !== undefined
            && typeof req.body.eligibleSubReservation[0].typeOfGood !== null
            && typeof req.body.eligibleSubReservation[0].typeOfGood.seatingType === 'string'
            && req.body.eligibleSubReservation[0].typeOfGood.seatingType.length > 0
            && typeof req.body.eligibleSubReservation[0].amountOfThisGood === 'string'
            && req.body.eligibleSubReservation[0].amountOfThisGood.length > 0) {
            const searchSeatingTypeResult = yield categoryCodeService.search({
                limit: 1,
                id: { $eq: req.body.eligibleSubReservation[0].typeOfGood.seatingType },
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
            });
            const seatingType = searchSeatingTypeResult.data.shift();
            if (seatingType === undefined) {
                throw new Error(`Seating Type ${req.body.eligibleSubReservation[0].typeOfGood.seatingType} Not Found`);
            }
            eligibleSubReservation = [{
                    typeOfGood: {
                        seatingType: seatingType.codeValue
                    },
                    amountOfThisGood: Number(req.body.eligibleSubReservation[0].amountOfThisGood)
                }];
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
        const itemOffered = {
            project: req.project,
            typeOf: productType_1.ProductType.EventService
        };
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ project: req.project, typeOf: 'Offer', priceCurrency: chevre.factory.priceCurrency.JPY, id: req.body.id, identifier: req.body.identifier, name: Object.assign(Object.assign({}, nameFromJson), { ja: req.body.name.ja, en: req.body.name.en }), description: req.body.description, alternateName: { ja: req.body.alternateName.ja, en: '' }, availability: availability, itemOffered: itemOffered, 
            // eligibleCustomerType: eligibleCustomerType,
            priceSpecification: {
                project: req.project,
                typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
                name: req.body.name,
                price: Number(req.body.price) * referenceQuantityValue,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true,
                eligibleQuantity: eligibleQuantity,
                eligibleTransactionVolume: eligibleTransactionVolume,
                referenceQuantity: referenceQuantity,
                appliesToMovieTicketType: appliesToMovieTicketType,
                accounting: accounting
            }, addOn: availableAddOn, additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined, color: req.body.indicatorColor }, (offerCategory !== undefined)
            ? {
                category: {
                    project: offerCategory.project,
                    id: offerCategory.id,
                    codeValue: offerCategory.codeValue
                }
            }
            : undefined), (Array.isArray(eligibleSeatingTypes))
            ? {
                eligibleSeatingType: eligibleSeatingTypes
            }
            : undefined), (eligibleMonetaryAmount !== undefined)
            ? {
                eligibleMonetaryAmount: eligibleMonetaryAmount
            }
            : undefined), (eligibleSubReservation !== undefined)
            ? {
                eligibleSubReservation: eligibleSubReservation
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
            // ...{
            //     $unset: { eligibleCustomerType: 1 }
            // },
            ? {
                $unset: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (offerCategory === undefined) ? { category: 1 } : undefined), (eligibleSeatingTypes === undefined) ? { eligibleSeatingType: 1 } : undefined), (eligibleMonetaryAmount === undefined) ? { eligibleMonetaryAmount: 1 } : undefined), (eligibleSubReservation === undefined) ? { eligibleSubReservation: 1 } : undefined), (validFrom === undefined) ? { validFrom: 1 } : undefined), (validThrough === undefined) ? { validThrough: 1 } : undefined)
            }
            : undefined);
    });
}
/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd() {
    return [
        express_validator_1.body('identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            // .isAlphanumeric()
            .matches(/^[0-9a-zA-Z\-_]+$/)
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLengthHalfByte('コード', NAME_MAX_LENGTH_CODE)),
        // 名称
        express_validator_1.body('name.ja', Message.Common.required.replace('$fieldName$', '名称'))
            .notEmpty(),
        express_validator_1.body('name.ja', Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_CODE))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),
        // 名称(英)
        express_validator_1.body('name.en', Message.Common.required.replace('$fieldName$', '名称(英)'))
            .notEmpty(),
        express_validator_1.body('name.en', Message.Common.getMaxLength('名称(英)', NAME_MAX_LENGTH_NAME_EN))
            .isLength({ max: NAME_MAX_LENGTH_NAME_EN }),
        express_validator_1.body('alternateName.ja', Message.Common.required.replace('$fieldName$', '代替名称'))
            .notEmpty(),
        express_validator_1.body('alternateName.ja', Message.Common.getMaxLength('代替名称', NAME_MAX_LENGTH_NAME_JA))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),
        // 購入席単位追加
        express_validator_1.body('seatReservationUnit', Message.Common.required.replace('$fieldName$', '購入席単位追加'))
            .notEmpty(),
        express_validator_1.body('price', Message.Common.required.replace('$fieldName$', '発生金額'))
            .notEmpty(),
        express_validator_1.body('price', Message.Common.getMaxLengthHalfByte('発生金額', CHAGE_MAX_LENGTH))
            .isNumeric()
            .isLength({ max: CHAGE_MAX_LENGTH }),
        express_validator_1.body('accountsReceivable', Message.Common.required.replace('$fieldName$', '売上金額'))
            .notEmpty(),
        express_validator_1.body('accountsReceivable', Message.Common.getMaxLengthHalfByte('売上金額', CHAGE_MAX_LENGTH))
            .isNumeric()
            .isLength({ max: CHAGE_MAX_LENGTH }),
        express_validator_1.body('eligibleMonetaryAmount.*.value')
            .optional()
            .if((value) => typeof value === 'string' && value.length > 0)
            .isNumeric()
            .withMessage('数値を入力してください')
            .isLength({ max: 10 }),
        express_validator_1.body('eligibleSubReservation.*.amountOfThisGood')
            .optional()
            .if((value) => typeof value === 'string' && value.length > 0)
            .isNumeric()
            .withMessage('数値を入力してください')
            .isLength({ max: 10 })
    ];
}
exports.default = ticketTypeMasterRouter;
