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
 * 劇場作品マスタコントローラー
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../../../../common/Const/Message");
const debug = createDebug('chevre-backend:*');
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
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const movieTheaters = yield placeRepo.searchMovieTheaters({});
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
                    const movieTheater = movieTheaters.find((m) => m.branchCode === req.body.locationBranchCode);
                    if (movieTheater === undefined) {
                        throw new Error('劇場が存在しません');
                    }
                    const attributes = yield createEventFromBody(req.body, movieTheater);
                    debug('saving an event...', attributes);
                    const event = yield eventRepo.saveScreeningEventSeries({
                        attributes: attributes
                    });
                    res.redirect(`/master/events/screeningEventSeries/${event.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = req.body;
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('master/events/screeningEventSeries/add', {
            message: message,
            errors: errors,
            layout: 'layouts/master/layout',
            forms: forms,
            movieTheaters: movieTheaters
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const movieTheaters = yield placeRepo.searchMovieTheaters({});
        let message = '';
        let errors = {};
        const eventId = req.params.eventId;
        const event = yield eventRepo.findById({
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            id: eventId
        });
        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'update');
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    const movieTheater = movieTheaters.find((m) => m.branchCode === req.body.locationBranchCode);
                    if (movieTheater === undefined) {
                        throw new Error('劇場が存在しません');
                    }
                    const attributes = yield createEventFromBody(req.body, movieTheater);
                    debug('saving an event...', attributes);
                    yield eventRepo.saveScreeningEventSeries({
                        id: eventId,
                        attributes: attributes
                    });
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            identifier: (_.isEmpty(req.body.identifier)) ? event.identifier : req.body.identifier,
            nameJa: (_.isEmpty(req.body.nameJa)) ? event.name.ja : req.body.nameJa,
            nameEn: (_.isEmpty(req.body.nameEn)) ? event.name.en : req.body.nameEn,
            kanaName: (_.isEmpty(req.body.kanaName)) ? event.kanaName : req.body.kanaName,
            duration: (_.isEmpty(req.body.duration)) ? moment.duration(event.duration).asMinutes() : req.body.duration,
            locationBranchCode: event.location.branchCode,
            contentRating: event.workPerformed.contentRating,
            subtitleLanguage: event.subtitleLanguage,
            videoFormat: event.videoFormat,
            startDate: (_.isEmpty(req.body.startDate)) ?
                (event.startDate !== null) ? moment(event.startDate).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
                req.body.startDate,
            endDate: (_.isEmpty(req.body.endDate)) ?
                (event.endDate !== null) ? moment(event.endDate).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
                req.body.endDate
        };
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('master/events/screeningEventSeries/edit', {
            message: message,
            errors: errors,
            layout: 'layouts/master/layout',
            forms: forms,
            movieTheaters: movieTheaters
        });
    });
}
exports.update = update;
/**
 * リクエストボディからイベントオブジェクトを作成する
 */
function createEventFromBody(body, movieTheater) {
    return {
        typeOf: chevre.factory.eventType.ScreeningEventSeries,
        identifier: body.identifier,
        name: {
            ja: body.nameJa,
            en: body.nameEn
        },
        kanaName: body.kanaName,
        alternativeHeadline: body.nameJa,
        location: movieTheater,
        // organizer: {
        //     typeOf: OrganizationType.MovieTheater,
        //     identifier: params.movieTheater.identifier,
        //     name: params.movieTheater.name
        // },
        videoFormat: body.videoFormat,
        subtitleLanguage: body.subtitleLanguage,
        workPerformed: {
            typeOf: chevre.factory.creativeWorkType.Movie,
            identifier: body.identifier,
            name: body.nameJa,
            duration: moment.duration(Number(body.duration), 'm').toISOString(),
            contentRating: body.contentRating
        },
        duration: moment.duration(Number(body.duration), 'm').toISOString(),
        startDate: (!_.isEmpty(body.startDate)) ? moment(`${body.startDate}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
        endDate: (!_.isEmpty(body.endDate)) ? moment(`${body.endDate}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
        eventStatus: chevre.factory.eventStatusType.EventScheduled
    };
}
/**
 * 一覧データ取得API
 */
// tslint:disable-next-line:cyclomatic-complexity
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        // 表示件数・表示ページ
        const limit = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
        const page = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
        const locationBranchCode = (!_.isEmpty(req.query.locationBranchCode)) ? req.query.identifier : null;
        // 作品コード
        const identifier = (!_.isEmpty(req.query.identifier)) ? req.query.identifier : null;
        // 登録日
        const createDateFrom = (!_.isEmpty(req.query.dateFrom)) ? req.query.dateFrom : null;
        const createDateTo = (!_.isEmpty(req.query.dateTo)) ? req.query.dateTo : null;
        // 作品名・カナ・英
        const filmNameJa = (!_.isEmpty(req.query.filmNameJa)) ? req.query.filmNameJa : null;
        const kanaName = (!_.isEmpty(req.query.kanaName)) ? req.query.kanaName : null;
        const filmNameEn = (!_.isEmpty(req.query.filmNameEn)) ? req.query.filmNameEn : null;
        // 検索条件を作成
        const conditions = {
            typeOf: chevre.factory.eventType.ScreeningEventSeries
        };
        // 劇場
        if (locationBranchCode !== null) {
            conditions['location.branchCode'] = req.query.locationBranchCode;
        }
        // 作品コード
        if (identifier !== null) {
            conditions.identifier = identifier;
        }
        if (createDateFrom !== null || createDateTo !== null) {
            const conditionsDate = {};
            // 登録日From
            if (createDateFrom !== null) {
                conditionsDate.$gte = moment(`${createDateFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(0, 'days').toDate();
            }
            // 登録日To
            if (createDateTo !== null) {
                conditionsDate.$lt = moment(`${createDateTo}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'days').toDate();
            }
            conditions.createdAt = conditionsDate;
        }
        // 作品名
        if (filmNameJa !== null) {
            conditions['name.ja'] = { $regex: `^${filmNameJa}` };
        }
        // 作品名カナ
        if (kanaName !== null) {
            conditions.kanaName = { $regex: kanaName };
        }
        // 作品名英
        if (filmNameEn !== null) {
            conditions['name.en'] = { $regex: filmNameEn };
        }
        try {
            const numDocs = yield eventRepo.eventModel.count(conditions).exec();
            let results = [];
            if (numDocs > 0) {
                const docs = yield eventRepo.eventModel.find(conditions).skip(limit * (page - 1)).limit(limit).exec();
                //検索結果編集
                results = docs.map((doc) => {
                    const event = doc.toObject();
                    return {
                        id: event.id,
                        identifier: event.identifier,
                        filmNameJa: event.name.ja,
                        filmNameEn: event.name.en,
                        kanaName: event.kanaName,
                        duration: moment.duration(event.duration).asMinutes(),
                        contentRating: event.contentRating,
                        subtitleLanguage: event.subtitleLanguage,
                        videoFormat: event.videoFormat
                    };
                });
            }
            res.json({
                success: true,
                count: numDocs,
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
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const movieTheaters = yield placeRepo.searchMovieTheaters({});
        res.render('master/events/screeningEventSeries/index', {
            filmModel: {},
            movieTheaters: movieTheaters,
            layout: 'layouts/master/layout'
        });
    });
}
exports.index = index;
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req, checkType) {
    let colName = '';
    // 作品コード
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名
    colName = '作品名';
    req.checkBody('nameJa', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameJa', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 作品名カナ
    colName = '作品名カナ';
    req.checkBody('kanaName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('kanaName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // .regex(/^[ァ-ロワヲンーa-zA-Z]*$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名英
    colName = '作品名英';
    req.checkBody('nameEn', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameEn', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 上映時間
    colName = '上映時間';
    req.checkBody('duration', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_MINUTES))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 上映開始日
    colName = '上映開始日';
    if (!_.isEmpty(req.body.startDate)) {
        req.checkBody('startDate', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).isDate();
    }
    // 上映終了日
    colName = '上映終了日';
    if (!_.isEmpty(req.body.endDate)) {
        req.checkBody('endDate', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).isDate();
    }
    // レイティング
    colName = 'レイティング';
    req.checkBody('contentRating', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // 上映形態
    colName = '上映形態';
    req.checkBody('videoFormat', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
