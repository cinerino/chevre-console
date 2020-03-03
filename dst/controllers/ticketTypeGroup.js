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
 * 券種グループマスタコントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const http_status_1 = require("http-status");
const moment = require("moment");
const _ = require("underscore");
const Message = require("../message");
const NUM_ADDITIONAL_PROPERTY = 10;
// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
/**
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // 券種グループマスタ画面遷移
        res.render('ticketTypeGroup/index', {
            message: '',
            ticketTypes: undefined
        });
    });
}
exports.index = index;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
                        project: { id: { $eq: req.project.id } },
                        identifier: { $eq: ticketTypeGroup.identifier }
                    });
                    if (data.length > 0) {
                        throw new Error(`既に存在する券種グループコードです: ${ticketTypeGroup.identifier}`);
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
            // tslint:disable-next-line:prefer-array-literal
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
        res.render('ticketTypeGroup/add', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const offerService = new chevre.service.Offer({
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
                    const ticketTypeGroup = yield createFromBody(req);
                    yield offerService.updateTicketTypeGroup(ticketTypeGroup);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種グループ取得
        const ticketGroup = yield offerService.findTicketTypeGroupById({ id: req.params.id });
        const forms = Object.assign(Object.assign(Object.assign({ additionalProperty: [] }, ticketGroup), { serviceType: (_a = ticketGroup.itemOffered.serviceType) === null || _a === void 0 ? void 0 : _a.codeValue, ticketTypes: ticketGroup.itemListElement.map((e) => e.id) }), req.body);
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
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
                limit: 100,
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
        res.render('ticketTypeGroup/update', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data
        });
    });
}
exports.update = update;
function createFromBody(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        let ticketTypes = (Array.isArray(body.ticketTypes)) ? body.ticketTypes : [body.ticketTypes];
        ticketTypes = [...new Set(ticketTypes)]; // 念のため券種IDをユニークに
        const itemListElement = ticketTypes.map((offerId) => {
            return {
                typeOf: chevre.factory.offerType.Offer,
                id: offerId
            };
        });
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
        const serviceType = searchServiceTypesResult.data.shift();
        if (serviceType === undefined) {
            throw new Error('興行区分が見つかりません');
        }
        return {
            project: req.project,
            id: body.id,
            identifier: req.body.identifier,
            name: body.name,
            description: body.description,
            alternateName: body.alternateName,
            // ticketTypes: ticketTypes,
            itemListElement: itemListElement,
            itemOffered: Object.assign({ serviceType: serviceType }, {
                typeOf: 'EventService' // 後にオファーカタログへ統合するため
            }),
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
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = yield offerService.searchTicketTypeGroups({
                limit: limit,
                page: page,
                sort: { identifier: chevre.factory.sortType.Ascending },
                project: { id: { $eq: req.project.id } },
                identifier: req.query.identifier,
                name: req.query.name,
                itemListElement: {},
                itemOffered: {
                    typeOf: {
                        $eq: (typeof ((_b = (_a = req.query.itemOffered) === null || _a === void 0 ? void 0 : _a.typeOf) === null || _b === void 0 ? void 0 : _b.$eq) === 'string' && ((_d = (_c = req.query.itemOffered) === null || _c === void 0 ? void 0 : _c.typeOf) === null || _d === void 0 ? void 0 : _d.$eq.length) > 0)
                            ? (_f = (_e = req.query.itemOffered) === null || _e === void 0 ? void 0 : _e.typeOf) === null || _f === void 0 ? void 0 : _f.$eq : undefined
                    }
                }
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((g) => {
                    return Object.assign(Object.assign({}, g), { offerCount: g.itemListElement.length });
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
    });
}
exports.getList = getList;
/**
 * 関連券種
 */
function getTicketTypeList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 券種グループ取得
            const ticketGroup = yield offerService.findTicketTypeGroupById({ id: req.query.id });
            const offerIds = ticketGroup.itemListElement.map((e) => e.id);
            const limit = 100;
            const page = 1;
            const { data } = yield offerService.searchTicketTypes({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                ids: offerIds
            });
            // 券種を登録順にソート
            const ticketTypes = data.sort((a, b) => offerIds.indexOf(a.id) - offerIds.indexOf(b.id));
            res.json({
                success: true,
                count: (ticketTypes.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(ticketTypes.length),
                results: ticketTypes.map((t) => (t.alternateName !== undefined) ? t.alternateName.ja : t.name.ja)
            });
        }
        catch (err) {
            res.json({
                success: false,
                results: err
            });
        }
    });
}
exports.getTicketTypeList = getTicketTypeList;
/**
 * 券種金額
 */
function getTicketTypePriceList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 指定価格の券種検索
            const limit = 100;
            const page = 1;
            const { data } = yield offerService.searchTicketTypes({
                limit: limit,
                page: page,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                project: { ids: [req.project.id] },
                priceSpecification: {
                    // 売上金額で検索
                    accounting: {
                        minAccountsReceivable: Number(req.query.price),
                        maxAccountsReceivable: Number(req.query.price)
                    }
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
    });
}
exports.getTicketTypePriceList = getTicketTypePriceList;
/**
 * 削除
 */
function deleteById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
            res.status(http_status_1.NO_CONTENT)
                .end();
        }
        catch (error) {
            res.status(http_status_1.BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    });
}
exports.deleteById = deleteById;
/**
 * 券種グループマスタ新規登録画面検証
 */
function validate(req) {
    // コード
    let colName = 'コード';
    req.checkBody('identifier')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .matches(/^[0-9a-zA-Z]+$/)
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '名称英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128))
        .len({ max: 128 });
    // 興行区分
    colName = '興行区分';
    req.checkBody('serviceType', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    //対象券種名
    colName = 'オファーリスト';
    req.checkBody('ticketTypes', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
}
