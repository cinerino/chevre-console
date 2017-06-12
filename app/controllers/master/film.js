"use strict";
/**
 * 作品マスタコントローラー
 *
 * @namespace controller/film
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
const createDebug = require("debug");
const moment = require("moment");
const _ = require("underscore");
const Message = require("../../../common/Const/Message");
const debug = createDebug('chevre-backend:controller:film');
// 基数
const DEFAULT_RADIX = 10;
// 1ページに表示するデータ数
const DEFAULT_LINES = 10;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 作品名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES = 10;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'add');
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    const id = req.body._id;
                    yield chevre_domain_1.Models.Film.create({
                        _id: id,
                        name: {
                            ja: req.body.nameJa,
                            en: req.body.nameEn
                        },
                        minutes: req.body.minutes,
                        rating: req.body.ratings,
                        sales_release_date: req.body.sales_release_date,
                        sales_end_date: req.body.sales_end_date,
                    });
                    message = '登録完了';
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            code: (_.isEmpty(req.body.code)) ? '' : req.body.code,
            nameJa: (_.isEmpty(req.body.nameJa)) ? '' : req.body.nameJa,
            nameEn: (_.isEmpty(req.body.nameEn)) ? '' : req.body.nameEn,
            minutes: (_.isEmpty(req.body.minutes)) ? '' : req.body.minutes,
            sales_release_date: (_.isEmpty(req.body.minutes)) ? '' : req.body.sales_release_date,
            sales_end_date: (_.isEmpty(req.body.minutes)) ? '' : req.body.sales_end_date
        };
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('master/film/add', {
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
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        const id = req.params.filmId;
        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'update');
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    const update = {
                        name: {
                            ja: req.body.nameJa,
                            en: req.body.nameEn
                        },
                        minutes: req.body.minutes
                    };
                    yield chevre_domain_1.Models.Film.findByIdAndUpdate(id, update).exec();
                    message = '編集完了';
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const film = yield chevre_domain_1.Models.Film.findById(id).exec();
        const forms = {
            code: (_.isEmpty(req.body.code)) ? film.get('_id') : req.body.code,
            nameJa: (_.isEmpty(req.body.nameJa)) ? film.get('name').ja : req.body.nameJa,
            nameEn: (_.isEmpty(req.body.nameEn)) ? film.get('name').en : req.body.nameEn,
            minutes: (_.isEmpty(req.body.minutes)) ? film.get('minutes') : req.body.minutes
        };
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('master/film/edit', {
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
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // 表示件数・表示ページ
        const limit = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
        const page = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
        // 作品コード
        const code = (!_.isEmpty(req.query.code)) ? req.query.code : null;
        // 登録日
        const createDateFrom = (!_.isEmpty(req.query.dateFrom)) ? req.query.dateFrom : null;
        const createDateTo = (!_.isEmpty(req.query.dateTo)) ? req.query.dateTo : null;
        // 作品名・カナ・英
        const filmNameJa = (!_.isEmpty(req.query.filmNameJa)) ? req.query.filmNameJa : null;
        const filmNameKana = (!_.isEmpty(req.query.filmNameKana)) ? req.query.filmNameKana : null;
        const filmNameEn = (!_.isEmpty(req.query.filmNameEn)) ? req.query.filmNameEn : null;
        // 検索条件を作成
        const conditions = {};
        // 作品コード
        if (code !== null) {
            const key = '_id';
            conditions[key] = code;
        }
        if (createDateFrom !== null || createDateTo !== null) {
            const conditionsDate = {};
            const key = 'created_at';
            // 登録日From
            if (createDateFrom !== null) {
                const keyFrom = '$gte';
                conditionsDate[keyFrom] = toISOStringJapan(createDateFrom);
            }
            // 登録日To
            if (createDateTo !== null) {
                const keyFrom = '$lt';
                conditionsDate[keyFrom] = toISOStringJapan(createDateTo, 1);
            }
            conditions[key] = conditionsDate;
        }
        // 作品名
        if (filmNameJa !== null) {
            conditions['name.ja'] = { $regex: `^${filmNameJa}` };
        }
        // 作品名カナ
        if (filmNameKana !== null) {
            conditions['name.kana'] = { $regex: filmNameKana };
        }
        // 作品名英
        if (filmNameEn !== null) {
            conditions['name.en'] = { $regex: filmNameEn };
        }
        try {
            const filmsCount = yield chevre_domain_1.Models.Film.count(conditions).exec();
            let results = [];
            if (filmsCount > 0) {
                const films = yield chevre_domain_1.Models.Film.find(conditions).skip(limit * (page - 1)).limit(limit).exec();
                //検索結果編集
                results = films.map((film) => {
                    return {
                        _id: film._id,
                        filmCode: film._id,
                        filmNameJa: film.get('name').ja,
                        filmNameKana: film.get('name').ja,
                        filmNameEn: film.get('name').en,
                        filmMinutes: film.get('minutes'),
                        subtitleDub: '字幕',
                        screeningForm: '通常'
                    };
                });
            }
            res.json({
                success: true,
                count: filmsCount,
                results: results
            });
        }
        catch (error) {
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
 * DB検索用ISO日付取得
 *
 * @param {string} dateStr
 * @param {number} addDay
 * @returns {string}
 */
function toISOStringJapan(dateStr, addDay = 0) {
    const dateWk = moment(dateStr, 'YYYY/MM/DD').add(addDay, 'days').format('YYYYMMDD');
    // tslint:disable-next-line:no-magic-numbers
    return `${dateWk.substr(0, 4)}-${dateWk.substr(4, 2)}-${dateWk.substr(6, 2)}T00:00:00+09:00`;
}
/**
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.render('master/film/index', {
            filmModel: {},
            layout: 'layouts/master/layout'
        });
    });
}
exports.index = index;
/**
 * 作品マスタ新規登録画面検証
 *
 * @param {any} req
 * @param {string} type
 */
function validate(req, checkType) {
    let colName = '';
    // 作品コード
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('_id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('_id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名
    colName = '作品名';
    req.checkBody('nameJa', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameJa', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 作品名カナ
    colName = '作品名カナ';
    req.checkBody('nameKana', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameKana', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // .regex(/^[ァ-ロワヲンーa-zA-Z]*$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名英
    colName = '作品名英';
    req.checkBody('nameEn', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameEn', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 上映時間
    colName = '上映時間';
    req.checkBody('minutes', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_MINUTES))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 上映開始日
    colName = '上映開始日';
    req.checkBody('sales_release_date', Message.Common.required.replace('$fieldName$', colName)).optional().isDate();
    // 上映終了日
    colName = '上映終了日';
    req.checkBody('sales_end_date', Message.Common.required.replace('$fieldName$', colName)).optional().isDate();
    // レイティング
    colName = 'レイティング';
    req.checkBody('ratings', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // 字幕/吹き替え
    colName = '字幕/吹き替え';
    req.checkBody('subtitleDub', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // 上映形態
    colName = '上映形態';
    req.checkBody('screeningForm', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
