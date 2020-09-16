/**
 * ルームルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { NO_CONTENT } from 'http-status';

import * as Message from '../../message';

const debug = createDebug('chevre-backend:router');

const NUM_ADDITIONAL_PROPERTY = 5;

const screeningRoomRouter = Router();

screeningRoomRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    debug(req.body);
                    req.body.id = '';
                    const screeningRoom = createFromBody(req, true);

                    // const { data } = await placeService.searchScreeningRooms({});
                    // const existingMovieTheater = data.find((d) => d.branchCode === screeningRoom.branchCode);
                    // if (existingMovieTheater !== undefined) {
                    //     throw new Error('枝番号が重複しています');
                    // }

                    await placeService.createScreeningRoom(screeningRoom);
                    req.flash('message', '登録しました');
                    res.redirect(`/places/screeningRoom/${screeningRoom.containedInPlace?.branchCode}:${screeningRoom.branchCode}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            additionalProperty: [],
            name: {},
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        res.render('places/screeningRoom/new', {
            message: message,
            errors: errors,
            forms: forms,
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

screeningRoomRouter.get(
    '',
    async (req, res) => {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        res.render('places/screeningRoom/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

screeningRoomRouter.get(
    '/search',
    async (req, res) => {
        try {
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await placeService.searchScreeningRooms({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                branchCode: {
                    $regex: (typeof req.query?.branchCode?.$regex === 'string'
                        && req.query?.branchCode?.$regex.length > 0)
                        ? req.query?.branchCode?.$regex
                        : undefined
                },
                containedInPlace: {
                    branchCode: {
                        $eq: (typeof req.query?.containedInPlace?.branchCode?.$eq === 'string'
                            && req.query?.containedInPlace?.branchCode?.$eq.length > 0)
                            ? req.query?.containedInPlace?.branchCode?.$eq
                            : undefined
                    }
                },
                name: {
                    $regex: (typeof req.query?.name?.$regex === 'string'
                        && req.query?.name?.$regex.length > 0)
                        ? req.query?.name?.$regex
                        : undefined
                }
            });

            const results = data.map((screeningRoom) => {
                return {
                    ...screeningRoom
                };
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: results
            });
        } catch (err) {
            res.json({
                message: err.message,
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
screeningRoomRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const splittedId = req.params.id.split(':');
        const movieTheaterBranchCode = splittedId[0];
        const screeningRoomBranchCode = splittedId[1];

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        const searchScreeningRoomsResult = await placeService.searchScreeningRooms({
            limit: 1,
            project: { id: { $eq: req.project.id } },
            branchCode: { $eq: screeningRoomBranchCode },
            containedInPlace: {
                branchCode: { $eq: movieTheaterBranchCode }
            }
        });

        let screeningRoom = searchScreeningRoomsResult.data[0];
        if (screeningRoom === undefined) {
            throw new Error('Screening Room Not Found');
        }

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    screeningRoom = createFromBody(req, false);
                    debug('saving screeningRoom...', screeningRoom);
                    await placeService.updateScreeningRoom(screeningRoom);

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
            ...screeningRoom,
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        res.render('places/screeningRoom/update', {
            message: message,
            errors: errors,
            forms: forms,
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

// tslint:disable-next-line:use-default-type-parameter
screeningRoomRouter.delete<ParamsDictionary>(
    '/:id',
    async (req, res) => {
        const splittedId = req.params.id.split(':');
        const movieTheaterBranchCode = splittedId[0];
        const screeningRoomBranchCode = splittedId[1];

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        await placeService.deleteScreeningRoom({
            project: { id: req.project.id },
            branchCode: screeningRoomBranchCode,
            containedInPlace: { branchCode: movieTheaterBranchCode }
        });

        res.status(NO_CONTENT)
            .end();
    }
);

function createFromBody(req: Request, isNew: boolean): chevre.factory.place.screeningRoom.IPlace {
    let openSeatingAllowed: boolean | undefined;
    if (req.body.openSeatingAllowed === '1') {
        openSeatingAllowed = true;
    }

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: chevre.factory.placeType.ScreeningRoom,
        branchCode: req.body.branchCode,
        name: req.body.name,
        address: req.body.address,
        containedInPlace: {
            project: { typeOf: req.project.typeOf, id: req.project.id },
            typeOf: chevre.factory.placeType.MovieTheater,
            branchCode: req.body.containedInPlace.branchCode
        },
        containsPlace: [], // 更新しないため空でよし
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        ...(typeof openSeatingAllowed === 'boolean')
            ? { openSeatingAllowed: openSeatingAllowed }
            : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    noExistingAttributeName: 1, // $unsetは空だとエラーになるので
                    ...(openSeatingAllowed === undefined) ? { 'containsPlace.$[screeningRoom].openSeatingAllowed': 1 } : undefined
                }
            }
            : undefined
    };
}

function validate() {
    return [
        body('branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '枝番号'))
            .matches(/^[0-9a-zA-Z]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('枝番号', 20)),

        body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 64))
    ];
}

export default screeningRoomRouter;
