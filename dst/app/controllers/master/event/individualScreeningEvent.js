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
 * パフォーマンスマスタコントローラー
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const moment = require("moment");
const debug = createDebug('chevre-backend:*');
/**
 * パフォーマンスマスタ管理表示
 */
function index(_, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            const movieTheaters = yield placeRepo.searchMovieTheaters({});
            if (movieTheaters.length === 0) {
                throw new Error('劇場が見つかりません');
            }
            res.render('master/events/individualScreeningEvent/index', {
                movieTheaters: movieTheaters,
                moment: moment,
                layout: 'layouts/master/layout'
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.index = index;
/**
 * パフォーマンス検索
 */
function search(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const ticketTypeGroupRepo = new chevre.repository.TicketTypeGroup(chevre.mongoose.connection);
        try {
            searchValidation(req);
            const validatorResult = yield req.getValidationResult();
            const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                res.json({
                    validation: validations,
                    error: null
                });
                return;
            }
            const theater = req.body.theater;
            const day = req.body.day;
            const movieTheater = yield placeRepo.findMovieTheaterByBranchCode(theater);
            const individualScreeningEvents = yield eventRepo.searchIndividualScreeningEvents({
                startFrom: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate(),
                endThrough: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').add(1, 'day').toDate()
                // theater: theater,
            });
            const ticketGroups = yield ticketTypeGroupRepo.ticketTypeGroupModel.find().exec();
            res.json({
                validation: null,
                error: null,
                performances: individualScreeningEvents,
                screens: movieTheater.containsPlace,
                ticketGroups: ticketGroups
            });
        }
        catch (err) {
            debug('search error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.search = search;
/**
 * 劇場作品検索
 */
function searchScreeningEvent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        try {
            validateSearchScreeningEvent(req);
            const validatorResult = yield req.getValidationResult();
            const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                res.json({
                    validation: validations,
                    error: null
                });
                return;
            }
            const identifier = req.body.identifier;
            const screeningEvent = yield eventRepo.eventModel.findOne({
                typeOf: chevre.factory.eventType.ScreeningEvent,
                identifier: identifier
            });
            res.json({
                validation: null,
                error: null,
                screeningEvent: screeningEvent
            });
        }
        catch (err) {
            debug('searchScreeningEvent error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.searchScreeningEvent = searchScreeningEvent;
/**
 * 新規登録
 */
function regist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            addValidation(req);
            const validatorResult = yield req.getValidationResult();
            const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                res.json({
                    validation: validations,
                    error: null
                });
                return;
            }
            debug('saving screening event...', req.body);
            const attributes = yield createEventFromBody(req.body);
            yield eventRepo.saveIndividualScreeningEvent({
                attributes: attributes
            });
            res.json({
                validation: null,
                error: null
            });
        }
        catch (err) {
            debug('regist error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.regist = regist;
/**
 * 更新
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            updateValidation(req);
            const validatorResult = yield req.getValidationResult();
            const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                res.json({
                    validation: validations,
                    error: null
                });
                return;
            }
            const eventId = req.params.eventId;
            debug('saving individual screening event...', req.body);
            const attributes = yield createEventFromBody(req.body);
            yield eventRepo.saveIndividualScreeningEvent({
                id: eventId,
                attributes: attributes
            });
            res.json({
                validation: null,
                error: null
            });
        }
        catch (err) {
            debug('update error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.update = update;
/**
 * リクエストボディからイベントオブジェクトを作成する
 */
function createEventFromBody(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const screeningEvent = yield eventRepo.findById({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            id: body.screeningEventId
        });
        const movieTheater = yield placeRepo.findMovieTheaterByBranchCode(body.theater);
        const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
        if (screeningRoom === undefined) {
            throw new Error('上映スクリーンが見つかりません');
        }
        if (screeningRoom.name === undefined) {
            throw new Error('上映スクリーン名が見つかりません');
        }
        return {
            typeOf: chevre.factory.eventType.IndividualScreeningEvent,
            // _id: `IndividualScreeningEvent-${identifier}`,
            identifier: '',
            doorTime: moment(`${body.day}T${body.doorTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            startDate: moment(`${body.day}T${body.startTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            endDate: moment(`${body.day}T${body.endTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            ticketTypeGroup: body.ticketTypeGroup,
            workPerformed: screeningEvent.workPerformed,
            location: {
                typeOf: screeningRoom.typeOf,
                branchCode: screeningRoom.branchCode,
                name: screeningRoom.name
            },
            superEvent: screeningEvent,
            name: screeningEvent.name,
            eventStatus: chevre.factory.eventStatusType.EventScheduled
        };
    });
}
/**
 * 検索バリデーション
 */
function searchValidation(req) {
    req.checkBody('theater', '作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
}
/**
 * 作品検索バリデーション
 */
function validateSearchScreeningEvent(req) {
    req.checkBody('identifier', '劇場作品コードが未選択です').notEmpty();
}
/**
 * 新規登録バリデーション
 */
function addValidation(req) {
    req.checkBody('screeningEventId', '劇場作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('doorTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}
/**
 * 編集バリデーション
 */
function updateValidation(req) {
    req.checkBody('screeningEventId', '劇場作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('doorTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}
