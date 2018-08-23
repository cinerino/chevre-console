/**
 * パフォーマンスマスタコントローラー
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';

const debug = createDebug('chevre-backend:*');

/**
 * パフォーマンスマスタ管理表示
 */
export async function index(_: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const movieTheaters = await placeRepo.searchMovieTheaters({});
        if (movieTheaters.length === 0) {
            throw new Error('劇場が見つかりません');
        }
        res.render('master/events/screeningEvent/index', {
            movieTheaters: movieTheaters,
            moment: moment,
            layout: 'layouts/master/layout'
        });
    } catch (err) {
        next(err);
    }
}

/**
 * パフォーマンス検索
 */
export async function search(req: Request, res: Response): Promise<void> {
    const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
    const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
    const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
    try {
        searchValidation(req);
        const validatorResult = await req.getValidationResult();
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
        const movieTheater = await placeRepo.findMovieTheaterByBranchCode(theater);
        const screeningEvents = await eventRepo.searchScreeningEvents({
            startFrom: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate(),
            endThrough: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').add(1, 'day').toDate()
            // theater: theater,
        });
        const ticketGroups = await ticketTypeRepo.ticketTypeGroupModel.find().exec();
        res.json({
            validation: null,
            error: null,
            performances: screeningEvents,
            screens: movieTheater.containsPlace,
            ticketGroups: ticketGroups
        });
    } catch (err) {
        debug('search error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}

/**
 * 劇場作品検索
 */
export async function searchScreeningEvent(req: Request, res: Response): Promise<void> {
    const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
    try {
        validateSearchScreeningEvent(req);
        const validatorResult = await req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });

            return;
        }
        const identifier = req.body.identifier;
        const screeningEvent = await eventRepo.eventModel.findOne({
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            identifier: identifier
        });
        res.json({
            validation: null,
            error: null,
            screeningEvent: screeningEvent
        });
    } catch (err) {
        debug('searchScreeningEvent error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}

/**
 * 新規登録
 */
export async function regist(req: Request, res: Response): Promise<void> {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        addValidation(req);
        const validatorResult = await req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });

            return;
        }

        debug('saving screening event...', req.body);
        const attributes = await createEventFromBody(req.body);
        await eventRepo.saveScreeningEvent({
            attributes: attributes
        });
        res.json({
            validation: null,
            error: null
        });
    } catch (err) {
        debug('regist error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}

/**
 * 更新
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        updateValidation(req);
        const validatorResult = await req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });

            return;
        }

        const eventId = req.params.eventId;
        debug('saving screening event...', req.body);
        const attributes = await createEventFromBody(req.body);
        await eventRepo.saveScreeningEvent({
            id: eventId,
            attributes: attributes
        });
        res.json({
            validation: null,
            error: null
        });
    } catch (err) {
        debug('update error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}

/**
 * リクエストボディからイベントオブジェクトを作成する
 */
async function createEventFromBody(body: any): Promise<chevre.factory.event.screeningEvent.IAttributes> {
    const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
    const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
    const screeningEventSeries = await eventRepo.findById({
        typeOf: chevre.factory.eventType.ScreeningEventSeries,
        id: body.screeningEventId
    });
    const movieTheater = await placeRepo.findMovieTheaterByBranchCode(body.theater);
    const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
    if (screeningRoom === undefined) {
        throw new Error('上映スクリーンが見つかりません');
    }
    if (screeningRoom.name === undefined) {
        throw new Error('上映スクリーン名が見つかりません');
    }

    return {
        typeOf: chevre.factory.eventType.ScreeningEvent,
        // _id: `IndividualScreeningEvent-${identifier}`,
        identifier: '',
        doorTime: moment(`${body.day}T${body.doorTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
        startDate: moment(`${body.day}T${body.startTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
        endDate: moment(`${body.day}T${body.endTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
        ticketTypeGroup: body.ticketTypeGroup,
        workPerformed: screeningEventSeries.workPerformed,
        location: {
            typeOf: screeningRoom.typeOf,
            branchCode: <string>screeningRoom.branchCode,
            name: screeningRoom.name
        },
        superEvent: screeningEventSeries,
        name: screeningEventSeries.name,
        eventStatus: chevre.factory.eventStatusType.EventScheduled
    };
}

/**
 * 検索バリデーション
 */
function searchValidation(req: Request): void {
    req.checkBody('theater', '作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
}

/**
 * 作品検索バリデーション
 */
function validateSearchScreeningEvent(req: Request): void {
    req.checkBody('identifier', '劇場作品コードが未選択です').notEmpty();
}

/**
 * 新規登録バリデーション
 */
function addValidation(req: Request): void {
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
function updateValidation(req: Request): void {
    req.checkBody('screeningEventId', '劇場作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('doorTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}
