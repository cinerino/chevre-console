/**
 * 映画作品コントローラー
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../../common/Const/Message';

const debug = createDebug('chevre-backend:*');

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
            try {
                const movie = createMovieFromBody(req.body);
                debug('saving an movie...', movie);
                const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
                await creativeWorkRepo.saveMovie(movie);
                res.redirect(`/creativeWorks/movie/${movie.identifier}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    const forms = req.body;

    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('creativeWorks/movie/add', {
        message: message,
        errors: errors,
        forms: forms
    });
}
/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
    let message = '';
    let errors: any = {};
    let movie = await creativeWorkRepo.findMovieByIdentifier({
        identifier: req.params.identifier
    });
    if (req.method === 'POST') {
        // バリデーション
        validate(req, 'update');
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                movie = createMovieFromBody(req.body);
                debug('saving an movie...', movie);
                await creativeWorkRepo.saveMovie(movie);
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        identifier: (_.isEmpty(req.body.identifier)) ? movie.identifier : req.body.identifier,
        name: (_.isEmpty(req.body.nameJa)) ? movie.name : req.body.name,
        duration: (_.isEmpty(req.body.duration)) ? moment.duration(movie.duration).asMinutes() : req.body.duration,
        contentRating: movie.contentRating
    };
    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('creativeWorks/movie/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}
function createMovieFromBody(body: any): chevre.factory.creativeWork.movie.ICreativeWork {
    return {
        typeOf: chevre.factory.creativeWorkType.Movie,
        identifier: body.identifier,
        name: body.name,
        duration: moment.duration(Number(body.duration), 'm').toISOString(),
        contentRating: body.contentRating
    };
}
/**
 * 一覧データ取得API
 */
// tslint:disable-next-line:cyclomatic-complexity
export async function getList(req: Request, res: Response): Promise<void> {
    const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
    // 表示件数・表示ページ
    const limit: number = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
    const page: number = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
    // 作品コード
    const identifier: string = (!_.isEmpty(req.query.identifier)) ? req.query.identifier : null;
    // 登録日
    const createDateFrom: string = (!_.isEmpty(req.query.dateFrom)) ? req.query.dateFrom : null;
    const createDateTo: string = (!_.isEmpty(req.query.dateTo)) ? req.query.dateTo : null;
    // 作品名・カナ・英
    const name: string = (!_.isEmpty(req.query.name)) ? req.query.name : null;

    // 検索条件を作成
    const conditions: any = {
        typeOf: chevre.factory.creativeWorkType.Movie
    };
    // 作品コード
    if (identifier !== null) {
        conditions.identifier = identifier;
    }
    if (createDateFrom !== null || createDateTo !== null) {
        const conditionsDate: any = {};
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
    if (name !== null) {
        conditions.name = { $regex: `^${name}` };
    }

    try {
        const numDocs = await creativeWorkRepo.creativeWorkModel.count(conditions).exec();
        let results: any[] = [];

        if (numDocs > 0) {
            const docs = await creativeWorkRepo.creativeWorkModel.find(conditions).skip(limit * (page - 1)).limit(limit).exec();

            //検索結果編集
            results = docs.map((doc) => doc.toObject());
        }

        res.json({
            success: true,
            count: numDocs,
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
 * 一覧
 */
export async function index(__: Request, res: Response): Promise<void> {
    res.render('creativeWorks/movie/index', {
        filmModel: {}
    });
}
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req: Request, checkType: string): void {
    let colName: string = '';
    // 作品コード
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名
    colName = '作品名';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 上映時間
    colName = '上映時間';
    req.checkBody('duration', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_MINUTES))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // レイティング
    colName = 'レイティング';
    req.checkBody('contentRating', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
