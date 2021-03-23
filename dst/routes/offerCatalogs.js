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
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const Message = require("../message");
const productType_1 = require("../factory/productType");
const NUM_ADDITIONAL_PROPERTY = 10;
// コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
const offerCatalogsRouter = express_1.Router();
offerCatalogsRouter.all('/add', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
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
                    throw new Error('既に存在するコードです');
                }
                offerCatalog = yield offerCatalogService.create(offerCatalog);
                req.flash('message', '登録しました');
                res.redirect(`/projects/${req.project.id}/offerCatalogs/${offerCatalog.id}/update`);
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
    if (typeof req.body.ticketTypes === 'string') {
        ticketTypeIds = [req.body.ticketTypes];
    }
    else if (Array.isArray(req.body.ticketTypes)) {
        ticketTypeIds = req.body.ticketTypes;
    }
    const forms = Object.assign({ additionalProperty: [], id: (typeof req.body.id !== 'string' || req.body.id.length === 0) ? '' : req.body.id, name: (req.body.name === undefined || req.body.name === null) ? {} : req.body.name, ticketTypes: (req.body.ticketTypes === undefined || req.body.ticketTypes === null) ? [] : ticketTypeIds, description: (req.body.description === undefined || req.body.description === null) ? {} : req.body.description, alternateName: (req.body.alternateName === undefined || req.body.alternateName === null) ? {} : req.body.alternateName }, req.body);
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
    res.render('offerCatalogs/add', {
        message: message,
        errors: errors,
        forms: forms,
        serviceTypes: searchServiceTypesResult.data,
        offers: offers,
        productTypes: productType_1.productTypes
    });
}));
// tslint:disable-next-line:use-default-type-parameter
offerCatalogsRouter.all('/:id/update', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                // DB登録
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
    const forms = Object.assign(Object.assign(Object.assign({ additionalProperty: [] }, offerCatalog), { serviceType: (_a = offerCatalog.itemOffered.serviceType) === null || _a === void 0 ? void 0 : _a.codeValue }), req.body);
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
            // 削除して問題ないカタログかどうか検証
            const searchEventsResult = yield eventService.search({
                limit: 1,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                project: { ids: [req.project.id] },
                hasOfferCatalog: { id: { $eq: req.params.id } },
                sort: { endDate: chevre.factory.sortType.Descending },
                endFrom: new Date()
            });
            if (searchEventsResult.data.length > 0) {
                throw new Error('終了していないスケジュールが存在します');
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
        const searchResult = yield offerService.search({
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            id: {
                $in: offerIds
            }
        });
        data = searchResult.data;
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
    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                serviceType: {
                    codeValue: {
                        $eq: (typeof ((_d = (_c = (_b = req.query.itemOffered) === null || _b === void 0 ? void 0 : _b.serviceType) === null || _c === void 0 ? void 0 : _c.codeValue) === null || _d === void 0 ? void 0 : _d.$eq) === 'string'
                            && req.query.itemOffered.serviceType.codeValue.$eq.length > 0)
                            ? req.query.itemOffered.serviceType.codeValue.$eq
                            : undefined
                    }
                },
                typeOf: {
                    $eq: (typeof ((_f = (_e = req.query.itemOffered) === null || _e === void 0 ? void 0 : _e.typeOf) === null || _f === void 0 ? void 0 : _f.$eq) === 'string' && ((_h = (_g = req.query.itemOffered) === null || _g === void 0 ? void 0 : _g.typeOf) === null || _h === void 0 ? void 0 : _h.$eq.length) > 0)
                        ? (_k = (_j = req.query.itemOffered) === null || _j === void 0 ? void 0 : _j.typeOf) === null || _k === void 0 ? void 0 : _k.$eq : undefined
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
    var _l;
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let data;
        const limit = 100;
        const page = 1;
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
        let itemListElement = [];
        if (Array.isArray(req.body.itemListElement)) {
            itemListElement = req.body.itemListElement.map((element) => {
                return {
                    typeOf: chevre.factory.offerType.Offer,
                    id: element.id
                };
            });
        }
        const MAX_NUM_OFFER = 100;
        if (itemListElement.length > MAX_NUM_OFFER) {
            throw new Error(`オファー数の上限は${MAX_NUM_OFFER}です`);
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
            typeOf: 'OfferCatalog',
            project: { typeOf: req.project.typeOf, id: req.project.id },
            id: req.body.id,
            identifier: req.body.identifier,
            name: req.body.name,
            description: req.body.description,
            alternateName: req.body.alternateName,
            itemListElement: itemListElement,
            itemOffered: Object.assign({ typeOf: (_a = req.body.itemOffered) === null || _a === void 0 ? void 0 : _a.typeOf }, (serviceType !== undefined) ? { serviceType } : undefined),
            additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
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
function validate() {
    return [
        express_validator_1.body('identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLength('コード', NAME_MAX_LENGTH_CODE)),
        express_validator_1.body('name.ja', Message.Common.required.replace('$fieldName$', '名称'))
            .notEmpty(),
        express_validator_1.body('name.ja', Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_NAME_JA))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),
        express_validator_1.body('name.en', Message.Common.required.replace('$fieldName$', '英語名称'))
            .notEmpty(),
        // tslint:disable-next-line:no-magic-numbers
        express_validator_1.body('name.en', Message.Common.getMaxLength('英語名称', 128))
            .isLength({ max: 128 }),
        express_validator_1.body('itemOffered.typeOf', Message.Common.required.replace('$fieldName$', 'アイテム'))
            .notEmpty(),
        express_validator_1.body('itemListElement')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'オファーリスト'))
    ];
}
exports.default = offerCatalogsRouter;
