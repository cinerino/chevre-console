/**
 * 作品マスタコントローラー
 *
 * @namespace controller/film
 */

import { Models } from '@motionpicture/chevre-domain';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment';
import * as _ from 'underscore';

import * as Message from '../../../common/Const/Message';

const debug = createDebug('chevre-backend:controller:film');

// 基数
const DEFAULT_RADIX: number = 10;
// 1ページに表示するデータ数
const DEFAULT_LINES: number = 10;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;
// 作品名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES: number = 10;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req, 'add');
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                const id = req.body._id;
                await Models.Film.create(
                    {
                        _id: id,
                        name: {
                            ja: req.body.nameJa,
                            en: req.body.nameEn
                        },
                        minutes: req.body.minutes,
                        rating: req.body.ratings,
                        sales_release_date: (!_.isEmpty(req.body.sales_release_date)) ?
                            moment(req.body.sales_release_date, 'YYYY/MM/DD').format('YYYYMMDD') : null,
                        sales_end_date: (!_.isEmpty(req.body.sales_end_date)) ?
                            moment(req.body.sales_end_date, 'YYYY/MM/DD').format('YYYYMMDD') : null
                    }
                );
                message = '登録完了';
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        code: (_.isEmpty(req.body.code)) ? '' : req.body.code,
        nameJa: (_.isEmpty(req.body.nameJa)) ? '' : req.body.nameJa,
        nameEn: (_.isEmpty(req.body.nameEn)) ? '' : req.body.nameEn,
        minutes: (_.isEmpty(req.body.minutes)) ? '' : req.body.minutes,
        sales_release_date: (_.isEmpty(req.body.sales_release_date)) ? null : req.body.sales_release_date,
        sales_end_date: (_.isEmpty(req.body.sales_end_date)) ? null : req.body.sales_end_date
    };

    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('master/film/add', {
        message: message,
        errors: errors,
        layout: 'layouts/master/layout',
        forms: forms
    });
}
/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};
    const id = req.params.filmId;

    if (req.method === 'POST') {
        // バリデーション
        validate(req, 'update');
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                const update = {
                    name: {
                        ja: req.body.nameJa,
                        en: req.body.nameEn
                    },
                    minutes: req.body.minutes,
                    sales_release_date: (!_.isEmpty(req.body.sales_release_date)) ?
                        moment(req.body.sales_release_date, 'YYYY/MM/DD').format('YYYYMMDD') : null,
                    sales_end_date: (!_.isEmpty(req.body.sales_end_date)) ?
                        moment(req.body.sales_end_date, 'YYYY/MM/DD').format('YYYYMMDD') : null
                };
                await Models.Film.findByIdAndUpdate(id, update).exec();
                message = '編集完了';
            } catch (error) {
                message = error.message;
            }
        }
    }
    const film = await Models.Film.findById(id).exec();
    const forms = {
        code: (_.isEmpty(req.body.code)) ? film.get('_id') : req.body.code,
        nameJa: (_.isEmpty(req.body.nameJa)) ? film.get('name').ja : req.body.nameJa,
        nameEn: (_.isEmpty(req.body.nameEn)) ? film.get('name').en : req.body.nameEn,
        minutes: (_.isEmpty(req.body.minutes)) ? film.get('minutes') : req.body.minutes,
        sales_release_date: (_.isEmpty(req.body.sales_release_date)) ?
            (_.isEmpty(film.get('sales_release_date'))) ? null : moment(film.get('sales_release_date'), 'YYYYMMDD').format('YYYY/MM/DD')
            : req.body.sales_release_date,
        sales_end_date: (_.isEmpty(req.body.sales_end_date)) ?
            (_.isEmpty(film.get('sales_end_date'))) ? null : moment(film.get('sales_end_date'), 'YYYYMMDD').format('YYYY/MM/DD')
            : req.body.sales_end_date
    };
    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('master/film/edit', {
        message: message,
        errors: errors,
        layout: 'layouts/master/layout',
        forms: forms
    });
}

/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    // 表示件数・表示ページ
    const limit: number = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
    const page: number = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
    // 作品コード
    const code: string = (!_.isEmpty(req.query.code)) ? req.query.code : null;
    // 登録日
    const createDateFrom: string = (!_.isEmpty(req.query.dateFrom)) ? req.query.dateFrom : null;
    const createDateTo: string = (!_.isEmpty(req.query.dateTo)) ? req.query.dateTo : null;
    // 作品名・カナ・英
    const filmNameJa: string = (!_.isEmpty(req.query.filmNameJa)) ? req.query.filmNameJa : null;
    const filmNameKana: string = (!_.isEmpty(req.query.filmNameKana)) ? req.query.filmNameKana : null;
    const filmNameEn: string = (!_.isEmpty(req.query.filmNameEn)) ? req.query.filmNameEn : null;

    // 検索条件を作成
    const conditions: any = {};
    // 作品コード
    if (code !== null) {
        const key: string = '_id';
        conditions[key] = code;
    }
    if (createDateFrom !== null || createDateTo !== null) {
        const conditionsDate: any = {};
        const key: string = 'created_at';
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
        const filmsCount = await Models.Film.count(conditions).exec();
        let results: any[] = [];

        if (filmsCount > 0) {
            const films = await Models.Film.find(conditions).skip(limit * (page - 1)).limit(limit).exec();

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
    } catch (error) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}

/**
 * DB検索用ISO日付取得
 *
 * @param {string} dateStr
 * @param {number} addDay
 * @returns {string}
 */
function toISOStringJapan(dateStr: string, addDay: number = 0): string {
    const dateWk: string = moment(dateStr, 'YYYY/MM/DD').add(addDay, 'days').format('YYYYMMDD');

    // tslint:disable-next-line:no-magic-numbers
    return `${dateWk.substr(0, 4)}-${dateWk.substr(4, 2)}-${dateWk.substr(6, 2)}T00:00:00+09:00`;
}

/**
 * 一覧
 */
export async function index(__: Request, res: Response): Promise<void> {
    res.render('master/film/index', {
        filmModel: {},
        layout: 'layouts/master/layout'
    });
}

/**
 * 作品マスタ新規登録画面検証
 *
 * @param {any} req
 * @param {string} type
 */
function validate(req: Request, checkType: string): void {
    let colName: string = '';
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
    if (!_.isEmpty(req.body.sales_release_date)) {
        req.checkBody('sales_release_date', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).isDate();
    }
    // 上映終了日
    colName = '上映終了日';
    if (!_.isEmpty(req.body.sales_end_date)) {
        req.checkBody('sales_end_date', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).isDate();
    }
    //Optionalの使い方が違う？
    // req.checkBody('sales_end_date', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).optional().isDate();
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
