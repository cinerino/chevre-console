/**
 * 作品コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

const NUM_ADDITIONAL_PROPERTY = 5;

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
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
                const movie = createMovieFromBody(req);
                const creativeWorkService = new chevre.service.CreativeWork({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });

                const { totalCount } = await creativeWorkService.searchMovies({ identifier: `^${movie.identifier}$` });
                if (totalCount > 0) {
                    throw new Error('既に存在する作品コードです');
                }

                debug('saving an movie...', movie);
                await creativeWorkService.createMovie(movie);
                req.flash('message', '登録しました');
                res.redirect(`/creativeWorks/movie/${movie.identifier}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    const forms = {
        additionalProperty: [],
        ...req.body
    };
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }

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
    const creativeWorkService = new chevre.service.CreativeWork({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    let movie = await creativeWorkService.findMovieByIdentifier({
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
                movie = createMovieFromBody(req);
                debug('saving an movie...', movie);
                await creativeWorkService.updateMovie(movie);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    const forms = {
        additionalProperty: [],
        ...movie,
        distribution: (movie.distributor !== undefined) ? movie.distributor.id : '',
        ...req.body,
        duration: (_.isEmpty(req.body.duration))
            ? (typeof movie.duration === 'string') ? moment.duration(movie.duration).asMinutes() : ''
            : req.body.duration,
        datePublished: (_.isEmpty(req.body.datePublished)) ?
            (movie.datePublished !== undefined) ? moment(movie.datePublished).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
            req.body.datePublished,
        offers: (_.isEmpty(req.body.offers)) ?
            (movie.offers !== undefined && movie.offers.availabilityEnds !== undefined)
                ? {
                    availabilityEnds: moment(movie.offers.availabilityEnds).add(-1, 'day').tz('Asia/Tokyo').format('YYYY/MM/DD')
                }
                : undefined
            : req.body.offers
    };
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }

    debug('errors:', errors);
    res.render('creativeWorks/movie/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}

function createMovieFromBody(req: Request): chevre.factory.creativeWork.movie.ICreativeWork {
    const body = req.body;

    const movie: chevre.factory.creativeWork.movie.ICreativeWork = {
        project: req.project,
        typeOf: chevre.factory.creativeWorkType.Movie,
        identifier: body.identifier,
        name: body.name,
        duration: (body.duration !== '') ? moment.duration(Number(body.duration), 'm').toISOString() : null,
        contentRating: (body.contentRating !== '') ? body.contentRating : null,
        headline: body.headline,
        datePublished: (!_.isEmpty(body.datePublished)) ?
            moment(`${body.datePublished}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
        offers: {
            typeOf: 'Offer',
            priceCurrency: chevre.factory.priceCurrency.JPY,
            availabilityEnds: (!_.isEmpty(body.offers) && !_.isEmpty(body.offers.availabilityEnds)) ?
                moment(`${body.offers.availabilityEnds}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate() : undefined
        },
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined
    };

    if (movie.offers !== undefined
        && movie.offers.availabilityEnds !== undefined
        && movie.datePublished !== undefined
        && movie.offers.availabilityEnds <= movie.datePublished) {
        throw new Error('興行終了予定日が公開日よりも前です');
    }

    return movie;
}

/**
 * 作品マスタ新規登録画面検証
 */
function validate(req: Request, checkType: string): void {
    let colName: string = '';
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),

    colName = '作品名';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });

    colName = '上映時間';
    if (req.body.duration !== '') {
        req.checkBody('duration', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_NAME_MINUTES)).optional()
            .isNumeric().len({ max: NAME_MAX_LENGTH_NAME_MINUTES });
    }

    colName = 'サブタイトル';
    req.checkBody('headline', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}
