/**
 * 上映イベントシリーズマスタ管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { INTERNAL_SERVER_ERROR } from 'http-status';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../../message';

const debug = createDebug('chevre-backend:routes');

const NUM_ADDITIONAL_PROPERTY = 10;

// 1ページに表示するデータ数
// const DEFAULT_LINES: number = 10;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

// import * as Message from '../../message';

const screeningEventSeriesRouter = Router();

screeningEventSeriesRouter.all<any>(
    '/add',
    ...validate(),
    async (req, res) => {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        // 上映方式タイプ検索
        const searchVideoFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
        });

        const searchContentRatingTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType } }
        });

        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    const searchMovieResult = await creativeWorkService.searchMovies({
                        project: { ids: [req.project.id] },
                        identifier: { $eq: req.body.workPerformed.identifier }
                    });
                    const movie = searchMovieResult.data.shift();
                    if (movie === undefined) {
                        throw new Error(`Movie ${req.body.workPerformed.identifier} Not Found`);
                    }

                    const movieTheater = await placeService.findMovieTheaterById({ id: req.body.locationId });
                    req.body.contentRating = movie.contentRating;
                    const attributes = createEventFromBody(req, movie, movieTheater, true);
                    debug('saving an event...', attributes);
                    const events = await eventService.create(attributes);
                    debug('event created', events[0]);
                    req.flash('message', '登録しました');
                    const redirect = `/events/screeningEventSeries/${events[0].id}/update`;
                    debug('redirecting...', redirect);
                    res.redirect(redirect);

                    return;
                } catch (error) {
                    message = error.message;
                }
            } else {
                message = '入力に誤りがあります';
            }
        }

        const forms = {
            additionalProperty: [],
            headline: {},
            workPerformed: {},
            videoFormatType: [],
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('events/screeningEventSeries/add', {
            message: message,
            errors: errors,
            forms: forms,
            movie: undefined,
            movieTheaters: searchMovieTheatersResult.data,
            videoFormatTypes: searchVideoFormatTypesResult.data,
            contentRatingTypes: searchContentRatingTypesResult.data
        });
    }
);

screeningEventSeriesRouter.get(
    '',
    async (req, res) => {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });
        res.render('events/screeningEventSeries/index', {
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

screeningEventSeriesRouter.get(
    '/getlist',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await eventService.search<chevre.factory.eventType.ScreeningEventSeries>({
                limit: limit,
                page: page,
                sort: { startDate: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                name: req.query.name,
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                endFrom: (req.query.containsEnded === '1') ? undefined : new Date(),
                location: {
                    branchCodes: (req.query.locationBranchCode !== '') ? [req.query.locationBranchCode] : undefined
                },
                workPerformed: {
                    identifiers: (typeof req.query.workPerformed?.identifier === 'string' && req.query.workPerformed?.identifier.length > 0)
                        ? [req.query.workPerformed?.identifier]
                        : undefined
                }
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data
            });
        } catch (error) {
            res.json({
                success: false,
                count: 0,
                results: error
            });
        }
    }
);

/**
 * 名前から作品候補を検索する
 */
screeningEventSeriesRouter.get(
    '/searchMovies',
    async (req, res) => {
        try {
            const creativeWorkService = new chevre.service.CreativeWork({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchMovieResult = await creativeWorkService.searchMovies({
                limit: 100,
                sort: { identifier: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                offers: {
                    availableFrom: new Date()
                },
                name: req.query.q
            });

            res.json(searchMovieResult);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR)
                .json({
                    message: error.message
                });
        }
    }
);

screeningEventSeriesRouter.get(
    '/search',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const locationId = <string>req.query.locationId;
            const movieTheater = await placeService.findMovieTheaterById({ id: locationId });

            const branchCode = movieTheater.branchCode;
            const fromDate = <string | undefined>req.query.fromDate;
            const toDate = <string | undefined>req.query.toDate;
            if (branchCode === undefined) {
                throw new Error();
            }
            // 上映終了して「いない」劇場上映作品を検索
            const limit = 100;
            const page = 1;
            const { data } = await eventService.search<chevre.factory.eventType.ScreeningEventSeries>({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                inSessionFrom: (fromDate !== undefined)
                    ? moment(`${fromDate}T23:59:59+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                        .toDate()
                    : new Date(),
                inSessionThrough: (toDate !== undefined)
                    ? moment(`${toDate}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                        .toDate()
                    : undefined,
                location: {
                    branchCodes: [branchCode]
                }
            });
            const results = data.map((event) => {
                let mvtkFlg = 1;
                if (event.offers !== undefined && Array.isArray(event.offers.acceptedPaymentMethod)
                    && event.offers.acceptedPaymentMethod.indexOf(chevre.factory.paymentMethodType.MovieTicket) < 0) {
                    mvtkFlg = 0;
                }

                let translationType = '';
                if (event.subtitleLanguage !== undefined && event.subtitleLanguage !== null) {
                    translationType = '字幕';
                }
                if (event.dubLanguage !== undefined && event.dubLanguage !== null) {
                    translationType = '吹替';
                }

                return {
                    ...event,
                    id: event.id,
                    filmNameJa: event.name.ja,
                    filmNameEn: event.name.en,
                    kanaName: event.kanaName,
                    duration: moment.duration(event.duration)
                        .humanize(),
                    contentRating: event.workPerformed.contentRating,
                    translationType: translationType,
                    videoFormat: event.videoFormat,
                    mvtkFlg: mvtkFlg
                };
            });

            // results.sort((event1, event2) => {
            //     if (event1.filmNameJa > event2.filmNameJa) {
            //         return 1;
            //     }
            //     if (event1.filmNameJa < event2.filmNameJa) {
            //         return -1;
            //     }

            //     return 0;
            // });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: results
            });
        } catch (_) {
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
screeningEventSeriesRouter.all<ParamsDictionary>(
    '/:eventId/update',
    ...validate(),
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        // 上映方式タイプ検索
        const searchVideoFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
        });

        const searchContentRatingTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType } }
        });

        let message = '';
        let errors: any = {};
        const eventId = req.params.eventId;
        const event = await eventService.findById<chevre.factory.eventType.ScreeningEventSeries>({
            id: eventId
        });

        let searchMovieResult = await creativeWorkService.searchMovies({
            project: { ids: [req.project.id] },
            identifier: { $eq: event.workPerformed.identifier }
        });
        let movie = searchMovieResult.data.shift();
        if (movie === undefined) {
            throw new Error(`Movie ${req.body.workPerformed.identifier} Not Found`);
        }

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    searchMovieResult = await creativeWorkService.searchMovies({
                        project: { ids: [req.project.id] },
                        identifier: { $eq: req.body.workPerformed.identifier }
                    });
                    movie = searchMovieResult.data.shift();
                    if (movie === undefined) {
                        throw new Error(`Movie ${req.body.workPerformed.identifier} Not Found`);
                    }

                    const movieTheater = await placeService.findMovieTheaterById({ id: req.body.locationId });
                    req.body.contentRating = movie.contentRating;
                    const attributes = createEventFromBody(req, movie, movieTheater, false);
                    debug('saving an event...', attributes);
                    await eventService.update({
                        id: eventId,
                        attributes: attributes
                    });
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            } else {
                message = '入力に誤りがあります';
            }
        }

        let mvtkFlg = 1;
        if (event.offers !== undefined
            && Array.isArray(event.offers.acceptedPaymentMethod)
            && event.offers.acceptedPaymentMethod.indexOf(chevre.factory.paymentMethodType.MovieTicket) < 0) {
            mvtkFlg = 0;
        }

        let translationType = '';
        if (event.subtitleLanguage !== undefined && event.subtitleLanguage !== null) {
            translationType = '0';
        }
        if (event.dubLanguage !== undefined && event.dubLanguage !== null) {
            translationType = '1';
        }

        const forms = {
            additionalProperty: [],
            headline: {},
            ...event,
            ...req.body,
            nameJa: (_.isEmpty(req.body.nameJa)) ? event.name.ja : req.body.nameJa,
            nameEn: (_.isEmpty(req.body.nameEn)) ? event.name.en : req.body.nameEn,
            duration: (_.isEmpty(req.body.duration)) ? moment.duration(event.duration)
                .asMinutes() : req.body.duration,
            locationId: event.location.id,
            translationType: translationType,
            videoFormatType: (Array.isArray(event.videoFormat)) ? event.videoFormat.map((f) => f.typeOf) : [],
            startDate: (_.isEmpty(req.body.startDate)) ?
                (event.startDate !== null) ? moment(event.startDate)
                    .tz('Asia/Tokyo')
                    .format('YYYY/MM/DD') : '' :
                req.body.startDate,
            endDate: (_.isEmpty(req.body.endDate)) ?
                (event.endDate !== null) ? moment(event.endDate)
                    .tz('Asia/Tokyo')
                    .add(-1, 'day')
                    .format('YYYY/MM/DD') : '' :
                req.body.endDate,
            mvtkFlg: (_.isEmpty(req.body.mvtkFlg)) ? mvtkFlg : req.body.mvtkFlg
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('events/screeningEventSeries/edit', {
            message: message,
            errors: errors,
            forms: forms,
            movie: movie,
            movieTheaters: searchMovieTheatersResult.data,
            videoFormatTypes: searchVideoFormatTypesResult.data,
            contentRatingTypes: searchContentRatingTypesResult.data
        });
    }
);

screeningEventSeriesRouter.get(
    '/:eventId/screeningEvents',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchScreeningEventsResult = await eventService.search<chevre.factory.eventType.ScreeningEvent>({
                ...req.query,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                superEvent: { ids: [req.params.eventId] }
            });
            res.json(searchScreeningEventsResult);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR)
                .json({ error: { message: error.message } });
        }
    }
);

/**
 * リクエストボディからイベントオブジェクトを作成する
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createEventFromBody(
    req: Request,
    movie: chevre.factory.creativeWork.movie.ICreativeWork,
    movieTheater: chevre.factory.place.movieTheater.IPlace,
    isNew: boolean
): chevre.factory.event.screeningEventSeries.IAttributes {
    const videoFormat = (Array.isArray(req.body.videoFormatType)) ? req.body.videoFormatType.map((f: string) => {
        return { typeOf: f, name: f };
    }) : [];
    const soundFormat = (Array.isArray(req.body.soundFormatType)) ? req.body.soundFormatType.map((f: string) => {
        return { typeOf: f, name: f };
    }) : [];

    let acceptedPaymentMethod: chevre.factory.paymentMethodType[] | undefined;
    // ムビチケ除外の場合は対応決済方法を追加
    Object.keys(chevre.factory.paymentMethodType)
        .forEach((key) => {
            if (acceptedPaymentMethod === undefined) {
                acceptedPaymentMethod = [];
            }

            const paymentMethodType = (<any>chevre.factory.paymentMethodType)[key];
            if (req.body.mvtkFlg !== '1' && paymentMethodType === chevre.factory.paymentMethodType.MovieTicket) {
                return;
            }

            acceptedPaymentMethod.push(paymentMethodType);
        });

    const offers: chevre.factory.event.screeningEventSeries.IOffer = {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: chevre.factory.offerType.Offer,
        priceCurrency: chevre.factory.priceCurrency.JPY,
        acceptedPaymentMethod: acceptedPaymentMethod
    };

    let subtitleLanguage: chevre.factory.language.ILanguage | undefined;
    if (req.body.translationType === '0') {
        subtitleLanguage = { typeOf: 'Language', name: 'Japanese' };
    }

    let dubLanguage: chevre.factory.language.ILanguage | undefined;
    if (req.body.translationType === '1') {
        dubLanguage = { typeOf: 'Language', name: 'Japanese' };
    }

    if (typeof movie.duration !== 'string') {
        throw new Error('作品の上映時間が未登録です');
    }

    let description: chevre.factory.multilingualString | undefined;
    if (typeof req.body.description === 'string' && req.body.description.length > 0) {
        description = { ja: req.body.description };
    }

    let headline: chevre.factory.multilingualString | undefined;
    if (typeof req.body.headline?.ja === 'string' && req.body.headline?.ja.length > 0) {
        headline = { ja: req.body.headline?.ja };
    }

    const workPerformed: chevre.factory.event.screeningEventSeries.IWorkPerformed = {
        project: movie.project,
        typeOf: movie.typeOf,
        id: movie.id,
        identifier: movie.identifier,
        name: movie.name,
        ...(typeof movie.duration === 'string') ? { duration: movie.duration } : undefined
    };

    const duration: string | undefined = (typeof movie.duration === 'string') ? movie.duration : undefined;

    return {
        project: req.project,
        typeOf: chevre.factory.eventType.ScreeningEventSeries,
        name: {
            ja: req.body.nameJa,
            ...(typeof req.body.nameEn === 'string' && req.body.nameEn.length > 0) ? { en: req.body.nameEn } : undefined
        },
        kanaName: req.body.kanaName,
        location: {
            project: req.project,
            id: movieTheater.id,
            typeOf: <chevre.factory.placeType.MovieTheater>movieTheater.typeOf,
            branchCode: movieTheater.branchCode,
            name: movieTheater.name,
            kanaName: movieTheater.kanaName
        },
        // organizer: {
        //     typeOf: OrganizationType.MovieTheater,
        //     identifier: params.movieTheater.identifier,
        //     name: params.movieTheater.name
        // },
        videoFormat: videoFormat,
        soundFormat: soundFormat,
        workPerformed: workPerformed,
        startDate: (typeof req.body.startDate === 'string' && req.body.startDate.length > 0)
            ? moment(`${req.body.startDate}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate()
            : undefined,
        endDate: (typeof req.body.endDate === 'string' && req.body.endDate.length > 0)
            ? moment(`${req.body.endDate}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .add(1, 'day')
                .toDate()
            : undefined,
        eventStatus: chevre.factory.eventStatusType.EventScheduled,
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        offers: offers,
        ...(typeof duration === 'string') ? { duration } : undefined,
        ...(subtitleLanguage !== undefined) ? { subtitleLanguage } : undefined,
        ...(dubLanguage !== undefined) ? { dubLanguage } : undefined,
        ...(headline !== undefined) ? { headline } : undefined,
        ...(description !== undefined) ? { description } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(typeof duration !== 'string') ? { duration: 1 } : undefined,
                    ...(subtitleLanguage === undefined) ? { subtitleLanguage: 1 } : undefined,
                    ...(dubLanguage === undefined) ? { dubLanguage: 1 } : undefined,
                    ...(headline === undefined) ? { headline: 1 } : undefined,
                    ...(description === undefined) ? { description: 1 } : undefined
                }
            }
            : undefined
    };
}

function validate() {
    return [
        body('workPerformed.identifier', Message.Common.required.replace('$fieldName$', 'コード'))
            .notEmpty(),
        body('workPerformed.identifier', Message.Common.getMaxLength('コード', NAME_MAX_LENGTH_CODE))
            .isLength({ max: NAME_MAX_LENGTH_CODE }),
        body('nameJa', Message.Common.required.replace('$fieldName$', '名称'))
            .notEmpty(),
        body('nameJa', Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_CODE))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),

        body('kanaName', Message.Common.getMaxLength('名称カナ', NAME_MAX_LENGTH_NAME_JA))
            .optional()
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),

        // body('startDate')
        //     .isDate()
        //     .withMessage('日付を入力してください'),

        // body('endDate')
        //     .isDate()
        //     .withMessage('日付を入力してください'),

        body('headline.ja', Message.Common.getMaxLength('サブタイトル', NAME_MAX_LENGTH_CODE))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),

        body('videoFormatType', Message.Common.required.replace('$fieldName$', '上映方式'))
            .notEmpty()
    ];
}

export default screeningEventSeriesRouter;
