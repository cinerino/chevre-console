/**
 * @namespace performance
 * @desc パフォーマンスマスタコントローラー
 */
import { Models } from '@motionpicture/chevre-domain';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';

const debug = createDebug('chevre-backend:controllers:performance');

/**
 * パフォーマンスマスタ管理表示
 * @memberof performance
 * @function index
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export async function index(_: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const theaters = await Models.Theater.find().exec();
        if (theaters.length === 0) {
            throw new Error('not theaters');
        }
        res.render('master/performance/', {
            theaters: theaters,
            moment: moment,
            layout: 'layouts/master/layout'
        });
    } catch (err) {
        next(err);
    }
}

/**
 * パフォーマンス検索
 * @memberof performance
 * @function search
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function search(req: Request, res: Response): Promise<void> {
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
        const screens = await Models.Screen.find({
            theater: theater
        }).exec();
        const performances = await Models.Performance.find({
            theater: theater,
            day: day
        }).populate('film', 'name').exec();
        const ticketGroups = await Models.TicketTypeGroup.find().exec();
        res.json({
            validation: null,
            error: null,
            performances: performances,
            screens: screens,
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
 * 作品検索
 * @memberof performance
 * @function filmSearch
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function filmSearch(req: Request, res: Response): Promise<void> {
    try {
        filmSearchValidation(req);
        const validatorResult = await req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });

            return;
        }
        const id = req.body.id;
        const film = await Models.Film.findById(id).exec();
        res.json({
            validation: null,
            error: null,
            film: film
        });
    } catch (err) {
        debug('filmSearch error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}

/**
 * 新規登録
 * @memberof performance
 * @function regist
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function regist(req: Request, res: Response): Promise<void> {
    try {
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
        const theater = await Models.Theater.findById(req.body.theater).exec();
        const screen = await Models.Screen.findById(req.body.screen).exec();
        const docs = {
            theater: req.body.theater,
            screen: req.body.screen,
            film: req.body.film,
            day: req.body.day,
            open_time: req.body.openTime,
            start_time: req.body.startTime,
            end_time: req.body.endTime,
            ticket_type_group: req.body.ticketTypeGroup,
            theater_name: theater.get('name'),
            screen_name: screen.get('name')
        };
        await Models.Performance.create(docs);
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
 * @memberof performance
 * @function update
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
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
        const id = req.body.performance;
        const update = {
            screen: req.body.screen,
            ticket_type_group: req.body.ticketTypeGroup,
            open_time: req.body.openTime,
            start_time: req.body.startTime,
            end_time: req.body.endTime
        };
        await Models.Performance.findByIdAndUpdate(id, update).exec();
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
 * 検索バリデーション
 * @function searchValidation
 * @param {Request} req
 * @returns {void}
 */
function searchValidation(req: Request): void {
    req.checkBody('theater', '作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
}

/**
 * 作品検索バリデーション
 * @function filmSearchValidation
 * @param {Request} req
 * @returns {void}
 */
function filmSearchValidation(req: Request): void {
    req.checkBody('id', '作品Idが未選択です').notEmpty();
}

/**
 * 新規登録バリデーション
 * @function addValidation
 * @param {Request} req
 * @returns {void}
 */
function addValidation(req: Request): void {
    req.checkBody('film', '作品が未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('openTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}

/**
 * 編集バリデーション
 * @function updateValidation
 * @param {Request} req
 * @returns {void}
 */
function updateValidation(req: Request): void {
    req.checkBody('performance', 'パフォーマンスが未選択です').notEmpty();
    req.checkBody('openTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}
