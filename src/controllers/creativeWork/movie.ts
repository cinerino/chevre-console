/**
 * 作品コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';

import * as Message from '../../message';

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

    const creativeWorkService = new chevre.service.CreativeWork({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                req.body.id = '';
                let movie = createFromBody(req, true);

                const { data } = await creativeWorkService.searchMovies({
                    limit: 1,
                    project: { ids: [req.project.id] },
                    identifier: { $eq: movie.identifier }
                });
                if (data.length > 0) {
                    throw new Error('既に存在する作品コードです');
                }

                debug('saving an movie...', movie);
                movie = await creativeWorkService.createMovie(movie);
                req.flash('message', '登録しました');
                res.redirect(`/creativeWorks/movie/${movie.id}/update`);

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
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }

    const searchContentRatingTypesResult = await categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType } }
    });

    const searchDistributorTypesResult = await categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
    });

    res.render('creativeWorks/movie/add', {
        message: message,
        errors: errors,
        forms: forms,
        contentRatingTypes: searchContentRatingTypesResult.data,
        distributorTypes: searchDistributorTypesResult.data
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

    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    let message = '';
    let errors: any = {};
    let movie = await creativeWorkService.findMovieById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                req.body.id = req.params.id;
                movie = createFromBody(req, false);
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
        duration: (typeof req.body.duration !== 'string')
            ? (typeof movie.duration === 'string') ? moment.duration(movie.duration)
                .asMinutes() : ''
            : req.body.duration,
        datePublished: (typeof req.body.datePublished !== 'string')
            ? (movie.datePublished !== undefined) ? moment(movie.datePublished)
                .tz('Asia/Tokyo')
                .format('YYYY/MM/DD') : ''
            : req.body.datePublished,
        offers: (typeof req.body.offers?.availabilityEnds !== 'string')
            ? (movie.offers !== undefined && movie.offers.availabilityEnds !== undefined)
                ? {
                    availabilityEnds: moment(movie.offers.availabilityEnds)
                        .add(-1, 'day')
                        .tz('Asia/Tokyo')
                        .format('YYYY/MM/DD')
                }
                : undefined
            : req.body.offers
    };
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }

    const searchContentRatingTypesResult = await categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType } }
    });

    const searchDistributorTypesResult = await categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
    });

    res.render('creativeWorks/movie/edit', {
        message: message,
        errors: errors,
        forms: forms,
        contentRatingTypes: searchContentRatingTypesResult.data,
        distributorTypes: searchDistributorTypesResult.data
    });
}

// tslint:disable-next-line:cyclomatic-complexity
function createFromBody(req: Request, isNew: boolean): chevre.factory.creativeWork.movie.ICreativeWork {
    const body = req.body;

    let contentRating: string | undefined;
    if (typeof body.contentRating === 'string' && body.contentRating.length > 0) {
        contentRating = body.contentRating;
    }

    let duration: string | undefined;
    if (typeof body.duration === 'string' && body.duration.length > 0) {
        duration = moment.duration(Number(body.duration), 'm')
            .toISOString();
    }

    let headline: string | undefined;
    if (typeof body.headline === 'string' && body.headline.length > 0) {
        headline = body.headline;
    }

    let datePublished: Date | undefined;
    if (typeof body.datePublished === 'string' && body.datePublished.length > 0) {
        datePublished = moment(`${body.datePublished}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
            .toDate();
    }

    let availabilityEnds: Date | undefined;
    if (typeof body.offers?.availabilityEnds === 'string' && body.offers?.availabilityEnds.length > 0) {
        availabilityEnds = moment(`${body.offers?.availabilityEnds}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
            .add(1, 'day')
            .toDate();
    }

    const offers: chevre.factory.creativeWork.movie.IOffer = {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: chevre.factory.offerType.Offer,
        priceCurrency: chevre.factory.priceCurrency.JPY,
        ...(availabilityEnds !== undefined) ? { availabilityEnds } : undefined
    };

    let distributor: chevre.factory.creativeWork.movie.IDistributor | undefined;
    const distributorCodeParam = body.distributor?.codeValue;
    if (typeof distributorCodeParam === 'string' && distributorCodeParam.length > 0) {
        distributor = {
            id: distributorCodeParam,
            distributorType: distributorCodeParam,
            ...{
                codeValue: distributorCodeParam
            }
        };
    }

    const movie: chevre.factory.creativeWork.movie.ICreativeWork = {
        project: req.project,
        typeOf: chevre.factory.creativeWorkType.Movie,
        id: body.id,
        identifier: body.identifier,
        name: body.name,
        offers: offers,
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        ...(contentRating !== undefined) ? { contentRating } : undefined,
        ...(duration !== undefined) ? { duration } : undefined,
        ...(headline !== undefined) ? { headline } : undefined,
        ...(datePublished !== undefined) ? { datePublished } : undefined,
        ...(distributor !== undefined) ? { distributor } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(contentRating === undefined) ? { contentRating: 1 } : undefined,
                    ...(duration === undefined) ? { duration: 1 } : undefined,
                    ...(headline === undefined) ? { headline: 1 } : undefined,
                    ...(datePublished === undefined) ? { datePublished: 1 } : undefined,
                    ...(distributor === undefined) ? { distributor: 1 } : undefined
                }
            }
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
function validate(req: Request): void {
    let colName: string = 'コード';
    req.checkBody('identifier')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .matches(/^[0-9a-zA-Z]+$/)
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));

    colName = '名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });

    colName = '上映時間';
    if (req.body.duration !== '') {
        req.checkBody('duration', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_NAME_MINUTES))
            .optional()
            .isNumeric()
            .len({ max: NAME_MAX_LENGTH_NAME_MINUTES });
    }

    colName = 'サブタイトル';
    req.checkBody('headline', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });

    // colName = '公開日';
    // req.checkBody('datePublished')
    //     .notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName));

    // colName = '興行終了予定日';
    // req.checkBody('offers.availabilityEnds')
    //     .notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName));
}
