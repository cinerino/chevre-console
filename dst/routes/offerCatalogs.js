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
const Message = require("../common/Const/Message");
const NUM_ADDITIONAL_PROPERTY = 10;
// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
const offerCatalogsRouter = express_1.Router();
offerCatalogsRouter.all('/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
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
                let ticketTypeGroup = yield createFromBody(req);
                // 券種グループコード重複確認
                const { data } = yield offerService.searchTicketTypeGroups({
                    project: { ids: [req.project.id] },
                    identifier: { $eq: ticketTypeGroup.identifier }
                });
                if (data.length > 0) {
                    throw new Error(`既に存在するコードです: ${ticketTypeGroup.identifier}`);
                }
                ticketTypeGroup = yield offerService.createTicketTypeGroup(ticketTypeGroup);
                req.flash('message', '登録しました');
                res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
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
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    // 券種マスタから取得
    let ticketTypes = [];
    if (typeof forms.ticketTypes === 'string') {
        forms.ticketTypes = [forms.ticketTypes];
    }
    if (forms.ticketTypes.length > 0) {
        const searchTicketTypesResult = yield offerService.searchTicketTypes({
            // sort: {
            //     'priceSpecification.price': chevre.factory.sortType.Descending
            // },
            project: { ids: [req.project.id] },
            ids: forms.ticketTypes
        });
        ticketTypes = searchTicketTypesResult.data;
        // 券種を登録順にソート
        ticketTypes = ticketTypes.sort((a, b) => forms.ticketTypes.indexOf(a.id) - forms.ticketTypes.indexOf(b.id));
    }
    res.render('offerCatalogs/add', {
        message: message,
        errors: errors,
        ticketTypes: ticketTypes,
        forms: forms,
        serviceTypes: searchServiceTypesResult.data
    });
}));
offerCatalogsRouter.all('/:id/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
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
    const forms = Object.assign(Object.assign({ additionalProperty: [] }, offerCatalog), req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    // オファー検索
    let offers = [];
    if (forms.itemListElement.length > 0) {
        const searchOffersResult = yield offerService.search({
            limit: 100,
            // sort: {
            //     'priceSpecification.price': chevre.factory.sortType.Descending
            // },
            project: { id: { $eq: req.project.id } },
            id: {
                $in: forms.itemListElement.map((element) => element.id)
            }
        });
        // 登録順にソート
        offers = searchOffersResult.data.sort((a, b) => offerCatalog.itemListElement.indexOf(a.id) - offerCatalog.itemListElement.indexOf(b.id));
    }
    res.render('offerCatalogs/update', {
        message: message,
        errors: errors,
        offers: offers,
        forms: forms
    });
}));
offerCatalogsRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const ticketTypeGroupId = req.params.id;
        // 削除して問題ない券種グループかどうか検証
        const searchEventsResult = yield eventService.search({
            limit: 1,
            typeOf: chevre.factory.eventType.ScreeningEvent,
            project: { ids: [req.project.id] },
            offers: {
                ids: [ticketTypeGroupId]
            },
            sort: { endDate: chevre.factory.sortType.Descending }
        });
        if (searchEventsResult.data.length > 0) {
            if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                throw new Error('終了していないスケジュールが存在します');
            }
        }
        yield offerService.deleteTicketTypeGroup({ id: ticketTypeGroupId });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        res.status(http_status_1.BAD_REQUEST).json({ error: { message: error.message } });
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
        const limit = 100;
        const page = 1;
        const { data } = yield offerService.search({
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            id: {
                $in: offerCatalog.itemListElement.map((element) => element.id)
            }
        });
        // 登録順にソート
        const offers = data.sort((a, b) => offerCatalog.itemListElement.indexOf(a.id) - offerCatalog.itemListElement.indexOf(b.id));
        res.json({
            success: true,
            count: (offers.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(offers.length),
            results: offers.map((o) => o.name.ja)
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
        ticketTypes: undefined
    });
}));
offerCatalogsRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield offerCatalogService.search({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            identifier: req.query.identifier,
            name: req.query.name
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((catalog) => {
                return Object.assign(Object.assign({}, catalog), { offerCount: (Array.isArray(catalog.itemListElement)) ? catalog.itemListElement.length : 0 });
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
    try {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 指定価格のオファー検索
        const limit = 100;
        const page = 1;
        const { data } = yield offerService.search({
            limit: limit,
            page: page,
            sort: {
                'priceSpecification.price': chevre.factory.sortType.Descending
            },
            project: { id: { $eq: req.project.id } },
            priceSpecification: {
                maxPrice: Number(req.query.price),
                minPrice: Number(req.query.price)
                // 売上金額で検索
                // accounting: {
                //     minAccountsReceivable: Number(req.query.price),
                //     maxAccountsReceivable: Number(req.query.price)
                // }
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
            results: err
        });
    }
}));
function createFromBody(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const itemListElement = (Array.isArray(body.itemListElement)) ? body.itemListElement : [];
        return {
            project: req.project,
            id: body.id,
            identifier: req.body.identifier,
            name: body.name,
            description: body.description,
            alternateName: body.alternateName,
            itemListElement: [...new Set(itemListElement)],
            itemOffered: {
                typeOf: 'Service'
            },
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
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '名称(英)';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128)).len({ max: 128 });
    colName = '対象オファー';
    req.checkBody('itemListElement', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
}
exports.default = offerCatalogsRouter;
