/**
 * スクリーンルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
import { validationResult } from 'express-validator';

const debug = createDebug('chevre-backend:router');

const NUM_ADDITIONAL_PROPERTY = 5;

const screeningRoomRouter = Router();

// screeningRoomRouter.all(
//     '/new',
//     async (req, res) => {
//         let message = '';
//         let errors: any = {};
//         if (req.method === 'POST') {
//             // バリデーション
//             // validate(req, 'add');
//             const validatorResult = await req.getValidationResult();
//             errors = req.validationErrors(true);
//             if (validatorResult.isEmpty()) {
//                 try {
//                     debug(req.body);
//                     req.body.id = '';
//                     const screeningRoom = createFromBody(req);
//                     const placeService = new chevre.service.Place({
//                         endpoint: <string>process.env.API_ENDPOINT,
//                         auth: req.user.authClient
//                     });

//                     const { data } = await placeService.searchMovieTheaters({});
//                     const existingMovieTheater = data.find((d) => d.branchCode === screeningRoom.branchCode);
//                     if (existingMovieTheater !== undefined) {
//                         throw new Error('枝番号が重複しています');
//                     }

//                     debug('existingMovieTheater:', existingMovieTheater);

//                     await placeService.createMovieTheater(screeningRoom);
//                     req.flash('message', '登録しました');
//                     res.redirect(`/places/movieTheater/${screeningRoom.branchCode}/update`);

//                     return;
//                 } catch (error) {
//                     message = error.message;
//                 }
//             }
//         }

//         const forms = {
//             additionalProperty: [],
//             name: {},
//             ...req.body
//         };
//         if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
//             forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
//                 return {};
//             }));
//         }

//         res.render('places/movieTheater/new', {
//             message: message,
//             errors: errors,
//             forms: forms
//         });
//     }
// );

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
                containedInPlace: {
                    branchCode: {
                        $eq: (typeof req.query?.containedInPlace?.branchCode?.$eq === 'string'
                            && req.query?.containedInPlace?.branchCode?.$eq.length > 0)
                            ? req.query?.containedInPlace?.branchCode?.$eq
                            : undefined
                    }
                }
                // name: req.query.name
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
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

screeningRoomRouter.all(
    '/:id/update',
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

function createFromBody(req: Request, isNew: boolean): chevre.factory.place.screeningRoom.IPlace {
    let openSeatingAllowed: boolean | undefined;
    if (req.body.openSeatingAllowed === '1') {
        openSeatingAllowed = true;
    }

    return {
        project: req.project,
        typeOf: chevre.factory.placeType.ScreeningRoom,
        branchCode: req.body.branchCode,
        name: req.body.name,
        address: req.body.address,
        containedInPlace: {
            project: req.project,
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

export default screeningRoomRouter;
