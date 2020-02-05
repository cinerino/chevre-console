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
 * 券種マスタコントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const _ = require("underscore");
const Message = require("../common/Const/Message");
const NUM_ADDITIONAL_PROPERTY = 10;
// 券種コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 券種名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;
/**
 * 新規登録
 */
// tslint:disable-next-line:cyclomatic-complexity
// tslint:disable-next-line:max-func-body-length
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
        // ムビチケ券種区分検索
        const searchMovieTicketTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });
        const searchAccountTitlesResult = yield accountTitleService.search({
            project: { ids: [req.project.id] }
        });
        const searchProductOffersResult = yield offerService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            itemOffered: {
                typeOf: { $eq: 'Product' }
            }
        });
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB登録プロセス
                try {
                    req.body.id = '';
                    let ticketType = yield createFromBody(req);
                    // 券種コード重複確認
                    const { data } = yield offerService.searchTicketTypes({
                        project: { ids: [req.project.id] },
                        identifier: { $eq: ticketType.identifier }
                    });
                    if (data.length > 0) {
                        throw new Error(`既に存在する券種コードです: ${ticketType.identifier}`);
                    }
                    ticketType = yield offerService.createTicketType(ticketType);
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
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }
        const searchCategoriesResult = yield offerService.searchCategories({ project: { ids: [req.project.id] } });
        res.render('ticketType/add', {
            message: message,
            errors: errors,
            forms: forms,
            movieTicketTypes: searchMovieTicketTypesResult.data,
            ticketTypeCategories: searchCategoriesResult.data,
            accountTitles: searchAccountTitlesResult.data,
            productOffers: searchProductOffersResult.data
        });
    });
}
exports.add = add;
/**
 * 編集
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const searchAccountTitlesResult = yield accountTitleService.search({
            project: { ids: [req.project.id] }
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // ムビチケ券種区分検索
        const searchMovieTicketTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });
        const searchProductOffersResult = yield offerService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            itemOffered: {
                typeOf: { $eq: 'Product' }
            }
        });
        let ticketType = yield offerService.findTicketTypeById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB更新プロセス
                try {
                    req.body.id = req.params.id;
                    ticketType = yield createFromBody(req);
                    yield offerService.updateTicketType(ticketType);
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
        const forms = Object.assign({ additionalProperty: [], alternateName: {}, priceSpecification: {
                referenceQuantity: {}
            } }, ticketType, { category: (ticketType.category !== undefined) ? ticketType.category.id : '', price: Math.floor(Number(ticketType.priceSpecification.price) / seatReservationUnit), accountsReceivable: Math.floor(Number(accountsReceivable) / seatReservationUnit) }, req.body, { isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit, accountTitle: (_.isEmpty(req.body.accountTitle))
                ? (ticketType.priceSpecification.accounting !== undefined
                    && ticketType.priceSpecification.accounting.operatingRevenue !== undefined)
                    ? ticketType.priceSpecification.accounting.operatingRevenue.codeValue : undefined
                : req.body.accountTitle });
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }
        const searchCategoriesResult = yield offerService.searchCategories({ project: { ids: [req.project.id] } });
        res.render('ticketType/update', {
            message: message,
            errors: errors,
            forms: forms,
            movieTicketTypes: searchMovieTicketTypesResult.data,
            ticketTypeCategories: searchCategoriesResult.data,
            accountTitles: searchAccountTitlesResult.data,
            productOffers: searchProductOffersResult.data
        });
    });
}
exports.update = update;
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const availableAddOn = [];
        if (req.body.availableAddOn !== undefined && req.body.availableAddOn !== '') {
            const searchProductOffersResult = yield offerService.search({
                limit: 1,
                id: { $eq: req.body.availableAddOn },
                project: { id: { $eq: req.project.id } },
                itemOffered: {
                    typeOf: { $eq: 'Product' }
                }
            });
            const productOffer = searchProductOffersResult.data.shift();
            if (productOffer === undefined) {
                throw new Error(`Product Offer ${req.body.availableAddOn} Not Found`);
            }
            availableAddOn.push({
                project: { typeOf: req.project.typeOf, id: req.project.id },
                typeOf: productOffer.typeOf,
                id: productOffer.id,
                name: productOffer.name,
                itemOffered: productOffer.itemOffered,
                priceCurrency: productOffer.priceCurrency,
                priceSpecification: productOffer.priceSpecification
            });
        }
        let availability = chevre.factory.itemAvailability.OutOfStock;
        if (body.isBoxTicket === '1' && body.isOnlineTicket === '1') {
            availability = chevre.factory.itemAvailability.InStock;
        }
        else if (body.isBoxTicket === '1') {
            availability = chevre.factory.itemAvailability.InStoreOnly;
        }
        else if (body.isOnlineTicket === '1') {
            availability = chevre.factory.itemAvailability.OnlineOnly;
        }
        const referenceQuantityValue = Number(body.seatReservationUnit);
        const referenceQuantity = {
            typeOf: 'QuantitativeValue',
            value: referenceQuantityValue,
            unitCode: chevre.factory.unitCode.C62
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
        const appliesToMovieTicketType = (typeof body.appliesToMovieTicketType === 'string' && body.appliesToMovieTicketType.length > 0)
            ? body.appliesToMovieTicketType
            : undefined;
        // const eligibleCustomerType: string[] | undefined = (body.eligibleCustomerType !== undefined && body.eligibleCustomerType !== '')
        //     ? [body.eligibleCustomerType]
        //     : undefined;
        const accounting = {
            typeOf: 'Accounting',
            operatingRevenue: undefined,
            accountsReceivable: Number(body.accountsReceivable) * referenceQuantityValue
        };
        if (body.accountTitle !== undefined && body.accountTitle !== '') {
            accounting.operatingRevenue = {
                typeOf: 'AccountTitle',
                codeValue: body.accountTitle,
                identifier: body.accountTitle,
                name: ''
            };
        }
        return {
            // ...{
            //     $unset: { eligibleCustomerType: 1 }
            // },
            project: req.project,
            typeOf: 'Offer',
            priceCurrency: chevre.factory.priceCurrency.JPY,
            id: body.id,
            identifier: req.body.identifier,
            name: body.name,
            description: body.description,
            alternateName: { ja: body.alternateName.ja, en: '' },
            availability: availability,
            // eligibleCustomerType: eligibleCustomerType,
            priceSpecification: {
                project: req.project,
                typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
                price: Number(body.price) * referenceQuantityValue,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true,
                eligibleQuantity: eligibleQuantity,
                eligibleTransactionVolume: eligibleTransactionVolume,
                referenceQuantity: referenceQuantity,
                appliesToMovieTicketType: appliesToMovieTicketType,
                accounting: accounting
            },
            addOn: availableAddOn,
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
                project: req.project,
                id: body.category
            },
            color: body.indicatorColor
        };
    });
}
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // ムビチケ券種区分検索
            const searchMovieTicketTypesResult = yield categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
            });
            // 券種グループ取得
            let ticketTypeIds = [];
            if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
                const ticketTypeGroup = yield offerService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
                if (ticketTypeGroup.ticketTypes !== null) {
                    ticketTypeIds = ticketTypeGroup.ticketTypes;
                }
                else {
                    //券種がありません。
                    res.json({
                        success: true,
                        count: 0,
                        results: []
                    });
                }
            }
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const searchConditions = {
                limit: limit,
                page: page,
                sort: { 'priceSpecification.price': chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                identifier: (req.query.identifier !== '' && req.query.identifier !== undefined) ? req.query.identifier : undefined,
                ids: ticketTypeIds,
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
            const { data } = yield offerService.searchTicketTypes(searchConditions);
            const searchCategoriesResult = yield offerService.searchCategories({ project: { ids: [req.project.id] } });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((t) => {
                    const category = searchCategoriesResult.data.find((c) => t.category !== undefined && c.id === t.category.id);
                    const mvtkType = searchMovieTicketTypesResult.data.find((movieTicketType) => {
                        return t.priceSpecification !== undefined
                            && movieTicketType.codeValue === t.priceSpecification.appliesToMovieTicketType;
                    });
                    return Object.assign({ appliesToMovieTicket: {
                            name: (t.priceSpecification !== undefined
                                && t.priceSpecification.appliesToMovieTicketType !== undefined
                                && mvtkType !== undefined)
                                ? mvtkType.name.ja
                                : undefined
                        } }, t, { eligibleQuantity: {
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
                        }, categoryName: (category !== undefined) ? category.name : '--', availableAddOnNames: (Array.isArray(t.addOn))
                            ? t.addOn.map((a) => {
                                return (a.name !== undefined) ? a.name.ja : a.id;
                            }).join('\n')
                            : '' });
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
    });
}
exports.getList = getList;
/**
 * 関連券種グループリスト
 */
function getTicketTypeGroupList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = 100;
            const page = 1;
            const { data } = yield offerService.searchTicketTypeGroups({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                ticketTypes: [req.params.ticketTypeId]
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
    });
}
exports.getTicketTypeGroupList = getTicketTypeGroupList;
/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req) {
    // 券種コード
    let colName = '券種コード';
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.en', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    colName = '代替名称';
    req.checkBody('alternateName.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('alternateName.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 購入席単位追加
    colName = '購入席単位追加';
    req.checkBody('seatReservationUnit', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '発生金額';
    req.checkBody('price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('price', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
    colName = '売上金額';
    req.checkBody('accountsReceivable', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('accountsReceivable', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
    // colName = '細目';
    // req.checkBody('accountTitle', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
