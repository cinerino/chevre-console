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
 * 券種グループマスタコントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const _ = require("underscore");
const Message = require("../common/Const/Message");
// 1ページに表示するデータ数
// const DEFAULT_LINES: number = 10;
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
            message: ''
        });
    });
}
exports.index = index;
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
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const ticketTypeGroup = {
                        id: req.body._id,
                        name: {
                            ja: req.body.nameJa,
                            en: req.body.nameEn
                        },
                        ticketTypes: req.body.ticketTypes
                    };
                    yield ticketTypeService.createTicketTypeGroup(ticketTypeGroup);
                    message = '登録完了';
                    res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種マスタから取得
        const ticketTypes = yield ticketTypeService.searchTicketTypes({});
        const forms = {
            _id: (_.isEmpty(req.body._id)) ? '' : req.body._id,
            nameJa: (_.isEmpty(req.body.nameJa)) ? '' : req.body.nameJa,
            ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : req.body.ticketTypes,
            descriptionJa: (_.isEmpty(req.body.descriptionJa)) ? '' : req.body.descriptionJa
        };
        res.render('ticketTypeGroup/add', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms
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
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 券種グループDB登録
                try {
                    // 券種グループDB登録
                    const ticketTypeGroup = {
                        id: req.params.id,
                        name: {
                            ja: req.body.nameJa,
                            en: req.body.nameEn
                        },
                        ticketTypes: req.body.ticketTypes
                    };
                    yield ticketTypeService.updateTicketTypeGroup(ticketTypeGroup);
                    message = '編集完了';
                    res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種マスタから取得
        const ticketTypes = yield ticketTypeService.searchTicketTypes({});
        // 券種グループ取得
        const ticketGroup = yield ticketTypeService.findTicketTypeGroupById({ id: req.params.id });
        const forms = {
            _id: (_.isEmpty(req.body._id)) ? ticketGroup.id : req.body._id,
            nameJa: (_.isEmpty(req.body.nameJa)) ? ticketGroup.name.ja : req.body.nameJa,
            ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : req.body.ticketTypes
        };
        res.render('ticketTypeGroup/update', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms
        });
    });
}
exports.update = update;
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // const limit: number = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
        // const page: number = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
        // const ticketGroupCode: string = (!_.isEmpty(req.query.ticketGroupCode)) ? req.query.ticketGroupCode : null;
        // const ticketGroupNameJa: string = (!_.isEmpty(req.query.ticketGroupNameJa)) ? req.query.ticketGroupNameJa : null;
        // const conditions: any = {};
        // if (ticketGroupCode !== null) {
        //     const key: string = '_id';
        //     conditions[key] = ticketGroupCode;
        // }
        // if (ticketGroupNameJa !== null) {
        //     conditions['name.ja'] = { $regex: ticketGroupNameJa };
        // }
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const ticketTypeGroups = yield ticketTypeService.searchTicketTypeGroups({});
            // const count = await ticketTypeRepo.ticketTypeGroupModel.count(conditions).exec();
            // let results: any[] = [];
            // if (count > 0) {
            //     const ticketTypeGroups = await ticketTypeRepo.ticketTypeGroupModel.find(conditions)
            //         .skip(limit * (page - 1))
            //         .limit(limit)
            //         .exec();
            //     //検索結果編集
            //     results = ticketTypeGroups.map((ticketTypeGroup) => {
            //         return {
            //             id: ticketTypeGroup._id,
            //             ticketGroupCode: ticketTypeGroup._id,
            //             ticketGroupNameJa: ticketTypeGroup.get('name').ja
            //         };
            //     });
            // }
            res.json({
                success: true,
                count: ticketTypeGroups.length,
                results: ticketTypeGroups.map((g) => {
                    return {
                        id: g.id,
                        ticketGroupCode: g.id,
                        ticketGroupNameJa: g.name.ja
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
 * 券種グループマスタ新規登録画面検証
 */
function validate(req) {
    // 券種グループコード
    let colName = '券種グループコード';
    req.checkBody('_id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('_id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種グループ名
    colName = 'サイト表示用券種グループ名';
    req.checkBody('nameJa', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameJa', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}
