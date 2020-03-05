/**
 * 座席ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';

const debug = createDebug('chevre-backend:router');

const NUM_ADDITIONAL_PROPERTY = 5;

const seatRouter = Router();

// seatRouter.all(
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
                    $eq: (typeof req.query?.branchCode?.$eq === 'string'
                        && req.query?.branchCode?.$eq.length > 0)
                        ? req.query?.branchCode?.$eq
                        : undefined
                },
                containedInPlace: {
                    containedInPlace: {
                        containedInPlace: {
                            branchCode: {
                                $eq: (typeof req.query?.containedInPlace?.containedInPlace?.containedInPlace?.branchCode?.$eq === 'string'
                                    && req.query?.containedInPlace?.containedInPlace?.containedInPlace?.branchCode?.$eq.length > 0)
                                    ? req.query?.containedInPlace?.containedInPlace?.containedInPlace?.branchCode?.$eq
                                    : undefined
                            }
                        }
                    }
                }
                // name: req.query.name
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

seatRouter.all(
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

            const searchSeatingTypesResult = await categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
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
                // validate(req, 'update');
                const validatorResult = await req.getValidationResult();
                errors = req.validationErrors(true);
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

            res.render('places/seat/update', {
                message: message,
                errors: errors,
                forms: forms,
                movieTheaters: searchMovieTheatersResult.data,
                seatingTypes: searchSeatingTypesResult.data
            });
        } catch (error) {
            next(error);
        }
    }
);

function createFromBody(req: Request, isNew: boolean): chevre.factory.place.seat.IPlace {
    const body = req.body;

    let seatingType: string[] | undefined;
    if (typeof body.seatingType === 'string' && body.seatingType.length > 0) {
        seatingType = [body.seatingType];
    }

    return {
        project: req.project,
        typeOf: chevre.factory.placeType.Seat,
        branchCode: body.branchCode,
        containedInPlace: {
            project: req.project,
            typeOf: chevre.factory.placeType.ScreeningRoomSection,
            branchCode: body.containedInPlace.branchCode,
            containedInPlace: {
                project: req.project,
                typeOf: chevre.factory.placeType.ScreeningRoom,
                branchCode: body.containedInPlace.containedInPlace.branchCode,
                containedInPlace: {
                    project: req.project,
                    typeOf: chevre.factory.placeType.MovieTheater,
                    branchCode: body.containedInPlace.containedInPlace.containedInPlace.branchCode
                }
            }
        },
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        ...(Array.isArray(seatingType)) ? { seatingType: seatingType } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    noExistingAttributeName: 1, // $unsetは空だとエラーになるので
                    ...(seatingType === undefined)
                        ? { 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType': 1 }
                        : undefined
                }
            }
            : undefined
    };
}

export default seatRouter;
