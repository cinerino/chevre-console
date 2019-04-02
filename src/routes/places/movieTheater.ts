/**
 * 劇場ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Router } from 'express';

const debug = createDebug('chevre-backend:router');

const movieTheaterRouter = Router();

movieTheaterRouter.all(
    '/new',
    async (req, res) => {
        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            // validate(req, 'add');
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const movieTheater = createMovieTheaterFromBody(req.body);
                    const placeService = new chevre.service.Place({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });

                    const { data } = await placeService.searchMovieTheaters({});
                    const existingMovieTheater = data.find((d) => d.branchCode === movieTheater.branchCode);
                    if (existingMovieTheater !== undefined) {
                        throw new Error('枝番号が重複しています');
                    }

                    debug('existingMovieTheater:', existingMovieTheater);

                    await placeService.createMovieTheater(movieTheater);
                    req.flash('message', '登録しました');
                    res.redirect(`/places/movieTheater/${movieTheater.branchCode}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            name: {},
            ...req.body
        };

        res.render('places/movieTheater/new', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
);

movieTheaterRouter.get(
    '',
    (_, res) => {
        res.render('places/movieTheater/index', {
            message: ''
        });
    }
);

movieTheaterRouter.get(
    '/search',
    async (req, res) => {
        try {
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const { totalCount, data } = await placeService.searchMovieTheaters({
                limit: req.query.limit,
                page: req.query.page,
                name: req.query.name
            });

            const results = data.map((movieTheater) => {
                const availabilityEndsGraceTimeInMinutes =
                    (movieTheater.offers !== undefined
                        && movieTheater.offers.availabilityEndsGraceTime !== undefined
                        && movieTheater.offers.availabilityEndsGraceTime.value !== undefined)
                        // tslint:disable-next-line:no-magic-numbers
                        ? Math.floor(movieTheater.offers.availabilityEndsGraceTime.value / 60)
                        : undefined;

                return {
                    ...movieTheater,
                    screenCount: (Array.isArray(movieTheater.containsPlace)) ? movieTheater.containsPlace.length : '--',
                    availabilityStartsGraceTimeInDays:
                        (movieTheater.offers !== undefined
                            && movieTheater.offers.availabilityStartsGraceTime !== undefined
                            && movieTheater.offers.availabilityStartsGraceTime.value !== undefined)
                            // tslint:disable-next-line:no-magic-numbers
                            ? -movieTheater.offers.availabilityStartsGraceTime.value
                            : undefined,
                    availabilityEndsGraceTimeInMinutes:
                        (availabilityEndsGraceTimeInMinutes !== undefined)
                            ? (availabilityEndsGraceTimeInMinutes >= 0)
                                ? `${availabilityEndsGraceTimeInMinutes}分後`
                                : `${-availabilityEndsGraceTimeInMinutes}分前`
                            : undefined
                };
            });

            res.json({
                success: true,
                count: totalCount,
                results: results
            });
        } catch (err) {
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

movieTheaterRouter.all(
    '/:branchCode/update',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let movieTheater = await placeService.findMovieTheaterByBranchCode({
            branchCode: req.params.branchCode
        });

        if (req.method === 'POST') {
            // バリデーション
            // validate(req, 'update');
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    movieTheater = createMovieTheaterFromBody(req.body);
                    debug('saving an movie theater...', movieTheater);
                    await placeService.updateMovieTheater(movieTheater);

                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...movieTheater,
            ...req.body
        };

        res.render('places/movieTheater/update', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
);

movieTheaterRouter.get(
    '/getScreenListByTheaterBranchCode',
    async (req, res) => {
        try {
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const branchCode = req.query.branchCode;
            const place = await placeService.findMovieTheaterByBranchCode({
                branchCode
            });
            const results = place.containsPlace.map((screen) => ({
                branchCode: screen.branchCode,
                name: screen.name !== undefined ? screen.name.ja : ''
            }));
            results.sort((screen1, screen2) => {
                if (screen1.name > screen2.name) {
                    return 1;
                }
                if (screen1.name < screen2.name) {
                    return -1;
                }

                return 0;
            });
            res.json({
                success: true,
                results
            });
        } catch (err) {
            res.json({
                success: false,
                results: []
            });
        }
    }
);

function createMovieTheaterFromBody(body: any): chevre.factory.place.movieTheater.IPlace {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const movieTheater: chevre.factory.place.movieTheater.IPlace = {
        id: '',
        typeOf: chevre.factory.placeType.MovieTheater,
        branchCode: body.branchCode,
        name: body.name,
        kanaName: body.kanaName,
        offers: JSON.parse(body.offers),
        containsPlace: JSON.parse(body.containsPlace),
        telephone: body.telephone,
        screenCount: 0
    };

    return movieTheater;
}

export default movieTheaterRouter;
