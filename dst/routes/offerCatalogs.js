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
 * オファーカタログ管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const _ = require("underscore");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const NUM_ADDITIONAL_PROPERTY = 10;
// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
const offerCatalogsRouter = express_1.Router();
offerCatalogsRouter.all('/add', 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                req.body.id = '';
                let offerCatalog = yield createFromBody(req);
                // コード重複確認
                const searchOfferCatalogsResult = yield offerCatalogService.search({
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: offerCatalog.identifier }
                });
                if (searchOfferCatalogsResult.data.length > 0) {
                    throw new Error(`既に存在するコードです: ${offerCatalog.identifier}`);
                }
                offerCatalog = yield offerCatalogService.create(offerCatalog);
                req.flash('message', '登録しました');
                res.redirect(`/offerCatalogs/${offerCatalog.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const searchServiceTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
    });
    let ticketTypeIds = [];
    if (!_.isEmpty(req.body.ticketTypes)) {
        if (_.isString(req.body.ticketTypes)) {
            ticketTypeIds = [req.body.ticketTypes];
        }
        else {
            ticketTypeIds = req.body.ticketTypes;
        }
    }
    const forms = Object.assign({ additionalProperty: [], id: (_.isEmpty(req.body.id)) ? '' : req.body.id, name: (_.isEmpty(req.body.name)) ? {} : req.body.name, ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : ticketTypeIds, description: (_.isEmpty(req.body.description)) ? {} : req.body.description, alternateName: (_.isEmpty(req.body.alternateName)) ? {} : req.body.alternateName }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    // オファー検索
    let offers = [];
    if (Array.isArray(forms.itemListElement) && forms.itemListElement.length > 0) {
        const itemListElementIds = forms.itemListElement.map((element) => element.id);
        if (((_a = forms.itemOffered) === null || _a === void 0 ? void 0 : _a.typeOf) === productType_1.ProductType.EventService) {
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                id: { $in: itemListElementIds }
            });
            // 登録順にソート
            offers = searchTicketTypesResult.data.sort((a, b) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id));
        }
        else {
            const searchOffersResult = yield offerService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                id: {
                    $in: itemListElementIds
                }
            });
            // 登録順にソート
            offers = searchOffersResult.data.sort((a, b) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id));
        }
    }
    res.render('offerCatalogs/add', {
        message: message,
        errors: errors,
        forms: forms,
        serviceTypes: searchServiceTypesResult.data,
        offers: offers,
        productTypes: productType_1.productTypes
    });
}));
offerCatalogsRouter.all('/:id/update', 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchServiceTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
    });
    let offerCatalog = yield offerCatalogService.findById({ id: req.params.id });
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                // 券種グループDB登録
                req.body.id = req.params.id;
                offerCatalog = yield createFromBody(req);
                yield offerCatalogService.update(offerCatalog);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign(Object.assign({ additionalProperty: [] }, offerCatalog), { serviceType: (_b = offerCatalog.itemOffered.serviceType) === null || _b === void 0 ? void 0 : _b.codeValue }), req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    // オファー検索
    let offers = [];
    if (Array.isArray(forms.itemListElement) && forms.itemListElement.length > 0) {
        const itemListElementIds = forms.itemListElement.map((element) => element.id);
        if (((_c = forms.itemOffered) === null || _c === void 0 ? void 0 : _c.typeOf) === productType_1.ProductType.EventService) {
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                id: { $in: itemListElementIds }
            });
            // 登録順にソート
            offers = searchTicketTypesResult.data.sort((a, b) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id));
        }
        else {
            const searchOffersResult = yield offerService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                id: {
                    $in: itemListElementIds
                }
            });
            // 登録順にソート
            offers = searchOffersResult.data.sort((a, b) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id));
        }
    }
    res.render('offerCatalogs/update', {
        message: message,
        errors: errors,
        offers: offers,
        forms: forms,
        serviceTypes: searchServiceTypesResult.data,
        productTypes: productType_1.productTypes
    });
}));
offerCatalogsRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalog = yield offerCatalogService.findById({ id: req.params.id });
        // tslint:disable-next-line:no-suspicious-comment
        // TODO 削除して問題ないカタログかどうか検証
        if (offerCatalog.itemOffered.typeOf === productType_1.ProductType.EventService) {
            // 削除して問題ない券種グループかどうか検証
            const searchEventsResult = yield eventService.search({
                limit: 1,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                project: { ids: [req.project.id] },
                offers: {
                    ids: [req.params.id]
                },
                sort: { endDate: chevre.factory.sortType.Descending }
            });
            if (searchEventsResult.data.length > 0) {
                if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                    throw new Error('終了していないスケジュールが存在します');
                }
            }
        }
        yield offerCatalogService.deleteById({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        res.status(http_status_1.BAD_REQUEST)
            .json({ error: { message: error.message } });
    }
}));
offerCatalogsRouter.get('/:id/offers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalog = yield offerCatalogService.findById({ id: req.params.id });
        const offerIds = offerCatalog.itemListElement.map((element) => element.id);
        const limit = 100;
        const page = 1;
        let data;
        if (offerCatalog.itemOffered.typeOf === productType_1.ProductType.EventService) {
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                id: { $in: offerIds }
            });
            data = searchTicketTypesResult.data;
        }
        else {
            const searchResult = yield offerService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                id: {
                    $in: offerIds
                }
            });
            data = searchResult.data;
        }
        // 登録順にソート
        const offers = data.sort((a, b) => offerIds.indexOf(a.id) - offerIds.indexOf(b.id));
        res.json({
            success: true,
            count: (offers.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(offers.length),
            results: offers
        });
    }
    catch (err) {
        res.json({
            success: false,
            results: err
        });
    }
}));
offerCatalogsRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('offerCatalogs/index', {
        message: '',
        ticketTypes: undefined,
        productTypes: productType_1.productTypes
    });
}));
offerCatalogsRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g, _h, _j;
    try {
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchServiceTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
        });
        const serviceTypes = searchServiceTypesResult.data;
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield offerCatalogService.search({
            limit: limit,
            page: page,
            sort: { identifier: chevre.factory.sortType.Ascending },
            project: { id: { $eq: req.project.id } },
            identifier: req.query.identifier,
            name: req.query.name,
            itemListElement: {},
            itemOffered: {
                typeOf: {
                    $eq: (typeof ((_e = (_d = req.query.itemOffered) === null || _d === void 0 ? void 0 : _d.typeOf) === null || _e === void 0 ? void 0 : _e.$eq) === 'string' && ((_g = (_f = req.query.itemOffered) === null || _f === void 0 ? void 0 : _f.typeOf) === null || _g === void 0 ? void 0 : _g.$eq.length) > 0)
                        ? (_j = (_h = req.query.itemOffered) === null || _h === void 0 ? void 0 : _h.typeOf) === null || _j === void 0 ? void 0 : _j.$eq : undefined
                }
            }
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((catalog) => {
                const serviceType = serviceTypes.find((s) => { var _a; return s.codeValue === ((_a = catalog.itemOffered.serviceType) === null || _a === void 0 ? void 0 : _a.codeValue); });
                const productType = productType_1.productTypes.find((p) => p.codeValue === catalog.itemOffered.typeOf);
                return Object.assign(Object.assign(Object.assign(Object.assign({}, catalog), (serviceType !== undefined) ? { serviceTypeName: serviceType.name.ja } : undefined), (productType !== undefined) ? { itemOfferedName: productType.name } : undefined), { offerCount: (Array.isArray(catalog.itemListElement)) ? catalog.itemListElement.length : 0 });
            })
        });
    }
    catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
offerCatalogsRouter.get('/searchOffersByPrice', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k, _l;
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const itemOfferedType = (_k = req.query.itemOffered) === null || _k === void 0 ? void 0 : _k.typeOf;
        let data;
        const limit = 100;
        const page = 1;
        if (itemOfferedType === productType_1.ProductType.EventService) {
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: limit,
                page: page,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                project: { id: { $eq: req.project.id } },
                priceSpecification: {
                    // 売上金額で検索
                    accounting: {
                        accountsReceivable: {
                            $gte: Number(req.query.price),
                            $lte: Number(req.query.price)
                        }
                    }
                }
            });
            data = searchTicketTypesResult.data;
        }
        else {
            // 指定価格のオファー検索
            const searchOffersResult = yield offerService.search({
                limit: limit,
                page: page,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                project: { id: { $eq: req.project.id } },
                itemOffered: { typeOf: { $eq: (_l = req.query.itemOffered) === null || _l === void 0 ? void 0 : _l.typeOf } },
                priceSpecification: {
                    // 売上金額で検索
                    accounting: {
                        accountsReceivable: {
                            $gte: Number(req.query.price),
                            $lte: Number(req.query.price)
                        }
                    }
                }
            });
            data = searchOffersResult.data;
        }
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
            results: err
        });
    }
}));
function createFromBody(req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        let itemListElement = [];
        if (Array.isArray(body.itemListElement)) {
            itemListElement = body.itemListElement.map((element) => {
                return {
                    typeOf: chevre.factory.offerType.Offer,
                    id: element.id
                };
            });
        }
        let serviceType;
        if (typeof req.body.serviceType === 'string' && req.body.serviceType.length > 0) {
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchServiceTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } },
                codeValue: { $eq: req.body.serviceType }
            });
            serviceType = searchServiceTypesResult.data.shift();
            if (serviceType === undefined) {
                throw new Error('サービス区分が見つかりません');
            }
            serviceType = {
                project: serviceType.project,
                id: serviceType.id,
                typeOf: serviceType.typeOf,
                codeValue: serviceType.codeValue,
                name: serviceType.name,
                inCodeSet: serviceType.inCodeSet
            };
        }
        return {
            project: req.project,
            id: body.id,
            identifier: req.body.identifier,
            name: body.name,
            description: body.description,
            alternateName: body.alternateName,
            itemListElement: itemListElement,
            itemOffered: Object.assign({ typeOf: (_a = body.itemOffered) === null || _a === void 0 ? void 0 : _a.typeOf }, (serviceType !== undefined) ? { serviceType } : undefined),
            additionalProperty: (Array.isArray(body.additionalProperty))
                ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined
        };
    });
}
function validate(req) {
    let colName = 'コード';
    req.checkBody('identifier')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '名称(英)';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128))
        .len({ max: 128 });
    colName = 'アイテム';
    req.checkBody('itemOffered.typeOf', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    // サービス区分
    // if (req.body.itemOffered?.typeOf === ProductType.EventService) {
    //     colName = 'サービス区分';
    //     req.checkBody('serviceType')
    //         .notEmpty()
    //         .withMessage(Message.Common.required.replace('$fieldName$', colName));
    // }
    colName = 'オファーリスト';
    req.checkBody('itemListElement')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));
}
exports.default = offerCatalogsRouter;
