"use strict";
/**
 * 券種マスタコントローラー
 *
 * @namespace controller/master/ticketType
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chevre_domain_1 = require("@motionpicture/chevre-domain");
const _ = require("underscore");
const Message = require("../../../common/Const/Message");
// 基数
const DEFAULT_RADIX = 10;
// 1ページに表示するデータ数
const DEFAULT_LINES = 10;
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
 * @function add
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    const id = req.body.ticketCode;
                    const docs = {
                        _id: id,
                        name: {
                            ja: req.body.ticketNameJa,
                            en: ''
                        },
                        charge: req.body.ticketCharge
                    };
                    yield chevre_domain_1.Models.TicketType.create(docs);
                    message = '登録完了';
                    res.redirect(`/master/ticketTypes/${id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            ticketCode: (_.isEmpty(req.body.ticketCode)) ? '' : req.body.ticketCode,
            ticketNameJa: (_.isEmpty(req.body.ticketNameJa)) ? '' : req.body.ticketNameJa,
            ticketNameEn: (_.isEmpty(req.body.ticketNameEn)) ? '' : req.body.ticketNameEn,
            managementTypeName: (_.isEmpty(req.body.managementTypeName)) ? '' : req.body.managementTypeName,
            ticketCharge: (_.isEmpty(req.body.ticketCharge)) ? '' : req.body.ticketCharge,
            descriptionJa: (_.isEmpty(req.body.descriptionJa)) ? '' : req.body.descriptionJa,
            descriptionEn: (_.isEmpty(req.body.descriptionEn)) ? '' : req.body.descriptionEn,
            hiddenColor: (_.isEmpty(req.body.hiddenColor)) ? '' : req.body.hiddenColor
        };
        res.render('master/ticketType/add', {
            message: message,
            errors: errors,
            layout: 'layouts/master/layout',
            forms: forms
        });
    });
}
exports.add = add;
/**
 * 編集
 * @function update
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        const id = req.params.id;
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB更新プロセス
                try {
                    const update = {
                        name: {
                            ja: req.body.ticketNameJa,
                            en: ''
                        },
                        charge: req.body.ticketCharge
                    };
                    yield chevre_domain_1.Models.TicketType.findByIdAndUpdate(id, update).exec();
                    message = '編集完了';
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const ticket = yield chevre_domain_1.Models.TicketType.findById(id).exec();
        const forms = {
            ticketCode: (_.isEmpty(req.body.ticketCode)) ? ticket.get('_id') : req.body.ticketCode,
            ticketNameJa: (_.isEmpty(req.body.ticketNameJa)) ? ticket.get('name').ja : req.body.ticketNameJa,
            ticketNameEn: (_.isEmpty(req.body.ticketNameEn)) ? ticket.get('name').en : req.body.ticketNameEn,
            managementTypeName: (_.isEmpty(req.body.managementTypeName)) ? '' : req.body.managementTypeName,
            ticketCharge: (_.isEmpty(req.body.ticketCharge)) ? ticket.get('charge') : req.body.ticketCharge,
            descriptionJa: (_.isEmpty(req.body.descriptionJa)) ? '' : req.body.descriptionJa,
            descriptionEn: (_.isEmpty(req.body.descriptionEn)) ? '' : req.body.descriptionEn,
            hiddenColor: (_.isEmpty(req.body.hiddenColor)) ? '' : req.body.hiddenColor
        };
        res.render('master/ticketType/update', {
            message: message,
            errors: errors,
            layout: 'layouts/master/layout',
            forms: forms
        });
    });
}
exports.update = update;
/**
 * 一覧データ取得API
 * @function getList
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // 表示件数・表示ページ
        const limit = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
        const page = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
        // 券種コード
        const ticketCode = (!_.isEmpty(req.query.ticketCode)) ? req.query.ticketCode : null;
        // 管理用券種名
        const managementTypeName = (!_.isEmpty(req.query.managementTypeName)) ? req.query.managementTypeName : null;
        // 金額
        const ticketCharge = (!_.isEmpty(req.query.ticketCharge)) ? req.query.ticketCharge : null;
        // 検索条件を作成
        const conditions = {};
        // 券種コード
        if (ticketCode !== null) {
            const key = '_id';
            conditions[key] = ticketCode;
        }
        // 管理用券種名
        if (managementTypeName !== null) {
            conditions['name.ja'] = { $regex: managementTypeName };
        }
        // 金額
        if (ticketCharge !== null) {
            const key = 'charge';
            conditions[key] = ticketCharge;
        }
        try {
            const count = yield chevre_domain_1.Models.TicketType.count(conditions).exec();
            let results = [];
            if (count > 0) {
                const ticketTypes = yield chevre_domain_1.Models.TicketType.find(conditions)
                    .skip(limit * (page - 1))
                    .limit(limit)
                    .exec();
                //検索結果編集
                results = ticketTypes.map((ticketType) => {
                    return {
                        _id: ticketType._id,
                        ticketCode: ticketType._id,
                        managementTypeName: ticketType.get('name').ja,
                        ticketCharge: ticketType.get('charge')
                    };
                });
            }
            res.json({
                success: true,
                count: count,
                results: results
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
 * @function list
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // 券種グループマスタ画面遷移
        res.render('master/ticketType/index', {
            message: '',
            layout: 'layouts/master/layout'
        });
    });
}
exports.index = index;
/**
 * 券種マスタ新規登録画面検証
 * @function validateFormAdd
 * @param {req} req
 * @returns {void}
 */
function validateFormAdd(req) {
    // 券種コード
    let colName = '券種コード';
    req.checkBody('ticketCode', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketCode', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('ticketNameJa', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketNameJa', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('ticketNameEn', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketNameEn', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 管理用券種名
    // colName = '管理用券種名';
    // req.checkBody('managementTypeName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody(
    //     'managementTypeName',
    //     Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_JA }
    //     );
    // 金額
    colName = '金額';
    req.checkBody('ticketCharge', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketCharge', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: CHAGE_MAX_LENGTH });
}
