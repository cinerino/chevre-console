/**
 * スクリーンセクションルーター
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

const screeningRoomSectionRouter = Router();

screeningRoomSectionRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const categoryCodeService = new chevre.service.CategoryCode({
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
                    const screeningRoomSection = createFromBody(req, true);

                    // const { data } = await placeService.searchScreeningRooms({});
                    // const existingMovieTheater = data.find((d) => d.branchCode === screeningRoom.branchCode);
                    // if (existingMovieTheater !== undefined) {
                    //     throw new Error('枝番号が重複しています');
                    // }

                    await placeService.createScreeningRoomSection(screeningRoomSection);
                    req.flash('message', '登録しました');
                    res.redirect(`/places/screeningRoomSection/${screeningRoomSection.containedInPlace?.containedInPlace?.branchCode}:${screeningRoomSection.containedInPlace?.branchCode}:${screeningRoomSection.branchCode}/update`);

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

        const searchSeatingTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });

        res.render('places/screeningRoomSection/new', {
            message: message,
            errors: errors,
            forms: forms,
            movieTheaters: searchMovieTheatersResult.data,
            seatingTypes: searchSeatingTypesResult.data
        });
    }
);

screeningRoomSectionRouter.get(
    '',
    async (req, res) => {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });

        res.render('places/screeningRoomSection/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    }
);

screeningRoomSectionRouter.get(
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
            const { data } = await placeService.searchScreeningRoomSections({
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
                        }
                    }
                }
                // name: req.query.name
            });

            const results = data.map((seat, index) => {
                return {
                    ...seat,
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

screeningRoomSectionRouter.all(
    '/:id/update',
    async (req, res, next) => {
        try {
            let message = '';
            let errors: any = {};

            const splittedId = req.params.id.split(':');
            const movieTheaterBranchCode = splittedId[0];
            const screeningRoomBranchCode = splittedId[1];
            // tslint:disable-next-line:no-magic-numbers
            const screeningRoomSectionBranchCode = splittedId[2];

            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchMovieTheatersResult = await placeService.searchMovieTheaters({
                project: { ids: [req.project.id] }
            });

            const searchScreeningRoomSectionsResult = await placeService.searchScreeningRoomSections({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                branchCode: { $eq: screeningRoomSectionBranchCode },
                containedInPlace: {
                    branchCode: { $eq: screeningRoomBranchCode },
                    containedInPlace: {
                        branchCode: { $eq: movieTheaterBranchCode }
                    }
                }
            });

            let screeningRoomSection = searchScreeningRoomSectionsResult.data[0];
            if (screeningRoomSection === undefined) {
                throw new Error('Screening Room Section Not Found');
            }

            if (req.method === 'POST') {
                // バリデーション
                const validatorResult = validationResult(req);
                errors = validatorResult.mapped();
                if (validatorResult.isEmpty()) {
                    try {
                        screeningRoomSection = createFromBody(req, false);
                        await placeService.updateScreeningRoomSection(screeningRoomSection);

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
                ...screeningRoomSection,
                ...req.body
            };
            if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
                // tslint:disable-next-line:prefer-array-literal
                forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                    return {};
                }));
            }

            res.render('places/screeningRoomSection/update', {
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
screeningRoomSectionRouter.delete<ParamsDictionary>(
    '/:id',
    async (req, res) => {
        const splittedId = req.params.id.split(':');
        const movieTheaterBranchCode = splittedId[0];
        const screeningRoomBranchCode = splittedId[1];
        // tslint:disable-next-line:no-magic-numbers
        const screeningRoomSectionBranchCode = splittedId[2];

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        await placeService.deleteScreeningRoomSection({
            project: req.project,
            branchCode: screeningRoomSectionBranchCode,
            containedInPlace: {
                branchCode: screeningRoomBranchCode,
                containedInPlace: {
                    branchCode: movieTheaterBranchCode
                }
            }
        });

        res.status(NO_CONTENT)
            .end();
    }
);

function createFromBody(req: Request, isNew: boolean): chevre.factory.place.screeningRoomSection.IPlace {
    return {
        project: req.project,
        typeOf: chevre.factory.placeType.ScreeningRoomSection,
        branchCode: req.body.branchCode,
        name: req.body.name,
        containedInPlace: {
            project: req.project,
            typeOf: chevre.factory.placeType.ScreeningRoom,
            branchCode: req.body.containedInPlace.branchCode,
            containedInPlace: {
                project: req.project,
                typeOf: chevre.factory.placeType.MovieTheater,
                branchCode: req.body.containedInPlace.containedInPlace.branchCode
            }
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
        ...(!isNew)
            ? {
                $unset: {
                    noExistingAttributeName: 1 // $unsetは空だとエラーになるので
                    // ...(seatingType === undefined)
                    //     ? { 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType': 1 }
                    //     : undefined
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
        body('containedInPlace.containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '劇場')),
        body('containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'スクリーン')),
        body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 64)),
        body('name.en')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称(English)', 64))
    ];
}

export default screeningRoomSectionRouter;
