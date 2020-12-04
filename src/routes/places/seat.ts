/**
 * 座席ルーター
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

const seatRouter = Router();

seatRouter.all<any>(
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
                    req.body.id = '';
                    const seat = createFromBody(req, true);

                    // const { data } = await placeService.searchScreeningRooms({});
                    // const existingMovieTheater = data.find((d) => d.branchCode === screeningRoom.branchCode);
                    // if (existingMovieTheater !== undefined) {
                    //     throw new Error('コードが重複しています');
                    // }

                    await placeService.createSeat(seat);
                    req.flash('message', '登録しました');
                    res.redirect(`/places/seat/${seat.containedInPlace?.containedInPlace?.containedInPlace?.branchCode}:${seat.containedInPlace?.containedInPlace?.branchCode}:${seat.containedInPlace?.branchCode}:${seat.branchCode}/update`);

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

        if (req.method === 'POST') {
            // 座席区分を補完
            if (typeof req.body.seatingType === 'string' && req.body.seatingType.length > 0) {
                forms.seatingType = JSON.parse(req.body.seatingType);
            } else {
                forms.seatingType = undefined;
            }
        }

        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        res.render('places/seat/new', {
            message: message,
            errors: errors,
            forms: forms,
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

seatRouter.get(
    '',
    async (req, res) => {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        res.render('places/seat/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

seatRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity
    async (req, res) => {
        try {
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await placeService.searchSeats({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                branchCode: {
                    $regex: (typeof req.query?.branchCode?.$eq === 'string'
                        && req.query?.branchCode?.$eq.length > 0)
                        ? req.query?.branchCode?.$eq
                        : undefined
                },
                containedInPlace: {
                    branchCode: {
                        $eq: (typeof req.query?.containedInPlace?.branchCode?.$eq === 'string'
                            && req.query?.containedInPlace?.branchCode?.$eq.length > 0)
                            ? req.query?.containedInPlace?.branchCode?.$eq
                            : undefined
                    },
                    containedInPlace: {
                        branchCode: {
                            $eq: (typeof req.query?.containedInPlace?.containedInPlace?.branchCode?.$eq === 'string'
                                && req.query?.containedInPlace?.containedInPlace?.branchCode?.$eq.length > 0)
                                ? req.query?.containedInPlace?.containedInPlace?.branchCode?.$eq
                                : undefined
                        },
                        containedInPlace: {
                            branchCode: {
                                $eq: (typeof req.query?.containedInPlace?.containedInPlace?.containedInPlace?.branchCode?.$eq === 'string'
                                    && req.query?.containedInPlace?.containedInPlace?.containedInPlace?.branchCode?.$eq.length > 0)
                                    ? req.query?.containedInPlace?.containedInPlace?.containedInPlace?.branchCode?.$eq
                                    : undefined
                            }
                        }
                    }
                },
                seatingType: {
                    $eq: (typeof req.query.seatingType?.$eq === 'string' && req.query.seatingType.$eq.length > 0)
                        ? req.query.seatingType.$eq
                        : undefined
                },
                name: {
                    $regex: (typeof req.query.name?.$regex === 'string' && req.query.name.$regex.length > 0)
                        ? req.query.name.$regex
                        : undefined
                }
            });

            const results = data.map((seat, index) => {
                return {
                    ...seat,
                    seatingTypeStr: (Array.isArray(seat.seatingType)) ? seat.seatingType.join(',') : '',
                    id: `${seat.branchCode}:${index}`
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
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
seatRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            let message = '';
            let errors: any = {};

            const splittedId = req.params.id.split(':');
            const movieTheaterBranchCode = splittedId[0];
            const screeningRoomBranchCode = splittedId[1];
            // tslint:disable-next-line:no-magic-numbers
            const screeningRoomSectionBranchCode = splittedId[2];
            // tslint:disable-next-line:no-magic-numbers
            const seatBranchCode = splittedId[3];

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

            const searchSeatsResult = await placeService.searchSeats({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                branchCode: { $eq: seatBranchCode },
                containedInPlace: {
                    branchCode: { $eq: screeningRoomSectionBranchCode },
                    containedInPlace: {
                        branchCode: { $eq: screeningRoomBranchCode },
                        containedInPlace: {
                            branchCode: { $eq: movieTheaterBranchCode }
                        }
                    }
                }
            });

            let seat = searchSeatsResult.data[0];
            if (seat === undefined) {
                throw new Error('Screening Room Not Found');
            }

            if (req.method === 'POST') {
                // バリデーション
                const validatorResult = validationResult(req);
                errors = validatorResult.mapped();
                if (validatorResult.isEmpty()) {
                    try {
                        seat = createFromBody(req, false);
                        debug('saving seat...', seat);
                        await placeService.updateSeat(seat);

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
                ...seat,
                ...req.body
            };
            if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
                // tslint:disable-next-line:prefer-array-literal
                forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                    return {};
                }));
            }

            if (req.method === 'POST') {
                // 座席区分を補完
                if (typeof req.body.seatingType === 'string' && req.body.seatingType.length > 0) {
                    forms.seatingType = JSON.parse(req.body.seatingType);
                } else {
                    forms.seatingType = undefined;
                }
            } else {
                if (Array.isArray(seat.seatingType)) {
                    const searchSeatingTypesResult = await categoryCodeService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } },
                        codeValue: { $eq: seat.seatingType[0] }
                    });
                    forms.seatingType = searchSeatingTypesResult.data[0];
                } else {
                    forms.seatingType = undefined;
                }
            }

            res.render('places/seat/update', {
                message: message,
                errors: errors,
                forms: forms,
                movieTheaters: searchMovieTheatersResult.data
            });
        } catch (error) {
            next(error);
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
seatRouter.delete<ParamsDictionary>(
    '/:id',
    async (req, res) => {
        const splittedId = req.params.id.split(':');
        const movieTheaterBranchCode = splittedId[0];
        const screeningRoomBranchCode = splittedId[1];
        // tslint:disable-next-line:no-magic-numbers
        const screeningRoomSectionBranchCode = splittedId[2];
        // tslint:disable-next-line:no-magic-numbers
        const seatBranchCode = splittedId[3];

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        await placeService.deleteSeat({
            project: { id: req.project.id },
            branchCode: seatBranchCode,
            containedInPlace: {
                branchCode: screeningRoomSectionBranchCode,
                containedInPlace: {
                    branchCode: screeningRoomBranchCode,
                    containedInPlace: { branchCode: movieTheaterBranchCode }
                }
            }
        });

        res.status(NO_CONTENT)
            .end();
    }
);

function createFromBody(req: Request, isNew: boolean): chevre.factory.place.seat.IPlace {
    let seatingType: string[] | undefined;
    if (typeof req.body.seatingType === 'string' && req.body.seatingType.length > 0) {
        const selectedSeatingType = JSON.parse(req.body.seatingType);
        if (typeof selectedSeatingType.codeValue === 'string' && selectedSeatingType.codeValue.length > 0) {
            seatingType = [selectedSeatingType.codeValue];
        }
    }

    let name: chevre.factory.multilingualString | undefined;
    if ((typeof req.body.name?.ja === 'string' && req.body.name.ja.length > 0)
        || (typeof req.body.name?.en === 'string' && req.body.name.en.length > 0)) {
        name = req.body.name;
    }

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: chevre.factory.placeType.Seat,
        branchCode: req.body.branchCode,
        containedInPlace: {
            project: { typeOf: req.project.typeOf, id: req.project.id },
            typeOf: chevre.factory.placeType.ScreeningRoomSection,
            branchCode: req.body.containedInPlace.branchCode,
            containedInPlace: {
                project: { typeOf: req.project.typeOf, id: req.project.id },
                typeOf: chevre.factory.placeType.ScreeningRoom,
                branchCode: req.body.containedInPlace.containedInPlace.branchCode,
                containedInPlace: {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: chevre.factory.placeType.MovieTheater,
                    branchCode: req.body.containedInPlace.containedInPlace.containedInPlace.branchCode
                }
            }
        },
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        ...(name !== undefined) ? { name: req.body.name } : undefined,
        ...(Array.isArray(seatingType)) ? { seatingType: seatingType } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    noExistingAttributeName: 1, // $unsetは空だとエラーになるので
                    ...(name === undefined)
                        ? { 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].name': 1 }
                        : undefined,
                    ...(seatingType === undefined)
                        ? { 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType': 1 }
                        : undefined
                }
            }
            : undefined
    };
}

function validate() {
    return [
        body('branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .matches(/^[0-9a-zA-Z\-]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('コード', 20)),
        body('containedInPlace.containedInPlace.containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '施設')),
        body('containedInPlace.containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'ルーム')),
        body('containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'セクション')),
        body('name.ja')
            .optional()
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 64)),
        body('name.en')
            .optional()
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称(English)', 64))
    ];
}

export default seatRouter;
