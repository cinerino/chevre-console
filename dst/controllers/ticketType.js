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
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB登録プロセス
                try {
                    const ticketType = yield ticketTypeService.createTicketType(createFromBody(req.body));
                    message = '登録完了';
                    res.redirect(`/ticketTypes/${ticketType.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
            name: (_.isEmpty(req.body.name)) ? {} : req.body.name,
            price: (_.isEmpty(req.body.price)) ? '' : req.body.price,
            description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
            alternateName: (_.isEmpty(req.body.alternateName)) ? {} : req.body.alternateName,
            availability: (_.isEmpty(req.body.availability)) ? '' : req.body.availability,
            hiddenColor: (_.isEmpty(req.body.hiddenColor)) ? '' : req.body.hiddenColor,
            eligibleQuantity: (_.isEmpty(req.body.hiddenColor)) ? {} : req.body.eligibleQuantity
        };
        res.render('ticketType/add', {
            message: message,
            errors: errors,
            forms: forms,
            ItemAvailability: chevre.factory.itemAvailability
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        let ticketType = yield ticketTypeService.findTicketTypeById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB更新プロセス
                try {
                    ticketType = Object.assign({ id: req.params.id }, createFromBody(req.body));
                    yield ticketTypeService.updateTicketType(ticketType);
                    message = '編集完了';
                    res.redirect(`/ticketTypes/${ticketType.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            id: (_.isEmpty(req.body.id)) ? ticketType.id : req.body.id,
            name: (_.isEmpty(req.body.name)) ? ticketType.name : req.body.name,
            price: (_.isEmpty(req.body.price)) ? ticketType.price : req.body.price,
            description: (_.isEmpty(req.body.description)) ? ticketType.description : req.body.description,
            alternateName: (_.isEmpty(req.body.alternateName)) ? ticketType.alternateName : req.body.alternateName,
            availability: (_.isEmpty(req.body.availability)) ? ticketType.availability : req.body.availability,
            hiddenColor: (_.isEmpty(req.body.hiddenColor)) ? '' : req.body.hiddenColor,
            eligibleQuantity: (_.isEmpty(req.body.eligibleQuantity)) ? ticketType.eligibleQuantity : req.body.eligibleQuantity
        };
        res.render('ticketType/update', {
            message: message,
            errors: errors,
            forms: forms,
            ItemAvailability: chevre.factory.itemAvailability
        });
    });
}
exports.update = update;
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const result = yield ticketTypeService.searchTicketTypes({
                limit: req.query.limit,
                page: req.query.page,
                id: req.query.id,
                name: req.query.name
            });
            res.json({
                success: true,
                count: result.totalCount,
                results: result.data.map((t) => {
                    return {
                        id: t.id,
                        ticketCode: t.id,
                        managementTypeName: t.name.ja,
                        price: t.price,
                        availability: t.availability,
                        eligilbleQuantityValue: t.eligibleQuantity.value
                    };
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
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // 券種マスタ画面遷移
        res.render('ticketType/index', {
            message: ''
        });
    });
}
exports.index = index;
function createFromBody(body) {
    const eligibleQuantity = {
        typeOf: 'QuantitativeValue',
        value: 1,
        unitCode: chevre.factory.unitCode.C62
    };
    if (body.eligibleQuantity !== undefined && body.eligibleQuantity.value !== '') {
        eligibleQuantity.value = Number(body.eligibleQuantity.value);
    }
    return Object.assign({}, body, { eligibleQuantity: eligibleQuantity });
}
/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req) {
    // 券種コード
    let colName = '券種コード';
    req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.en', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 管理用券種名
    // colName = '管理用券種名';
    // req.checkBody('managementTypeName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody(
    //     'managementTypeName',
    //     Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_JA }
    //     );
    // 金額
    colName = '金額';
    req.checkBody('price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('price', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: CHAGE_MAX_LENGTH });
    colName = '在庫';
    req.checkBody('availability', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '価格単位';
    req.checkBody('eligibleQuantity.value', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
