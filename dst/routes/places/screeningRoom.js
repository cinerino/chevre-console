"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * スクリーンルーター
 */
const chevre = require("@chevre/api-nodejs-client");
// import * as createDebug from 'debug';
const express_1 = require("express");
// const debug = createDebug('chevre-backend:router');
// const NUM_ADDITIONAL_PROPERTY = 5;
const screeningRoomRouter = express_1.Router();
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
screeningRoomRouter.get('', (_, res) => {
    res.render('places/screeningRoom/index', {
        message: ''
    });
});
screeningRoomRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield placeService.searchMovieTheaters({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            name: req.query.name
        });
        const results = data.map((movieTheater) => {
            const availabilityEndsGraceTimeInMinutes = (movieTheater.offers !== undefined
                && movieTheater.offers.availabilityEndsGraceTime !== undefined
                && movieTheater.offers.availabilityEndsGraceTime.value !== undefined)
                // tslint:disable-next-line:no-magic-numbers
                ? Math.floor(movieTheater.offers.availabilityEndsGraceTime.value / 60)
                : undefined;
            return Object.assign({}, movieTheater, { screenCount: (Array.isArray(movieTheater.containsPlace)) ? movieTheater.containsPlace.length : '--', availabilityStartsGraceTimeInDays: (movieTheater.offers !== undefined
                    && movieTheater.offers.availabilityStartsGraceTime !== undefined
                    && movieTheater.offers.availabilityStartsGraceTime.value !== undefined)
                    // tslint:disable-next-line:no-magic-numbers
                    ? -movieTheater.offers.availabilityStartsGraceTime.value
                    : undefined, availabilityEndsGraceTimeInMinutes: (availabilityEndsGraceTimeInMinutes !== undefined)
                    ? (availabilityEndsGraceTimeInMinutes >= 0)
                        ? `${availabilityEndsGraceTimeInMinutes}分後`
                        : `${-availabilityEndsGraceTimeInMinutes}分前`
                    : undefined });
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: results
        });
    }
    catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
// screeningRoomRouter.all(
//     '/:id/update',
//     async (req, res) => {
//         let message = '';
//         let errors: any = {};
//         const placeService = new chevre.service.Place({
//             endpoint: <string>process.env.API_ENDPOINT,
//             auth: req.user.authClient
//         });
//         let movieTheater = await placeService.findMovieTheaterById({
//             id: req.params.id
//         });
//         if (req.method === 'POST') {
//             // バリデーション
//             // validate(req, 'update');
//             const validatorResult = await req.getValidationResult();
//             errors = req.validationErrors(true);
//             if (validatorResult.isEmpty()) {
//                 try {
//                     req.body.id = req.params.id;
//                     movieTheater = createFromBody(req);
//                     debug('saving an movie theater...', movieTheater);
//                     await placeService.updateMovieTheater(movieTheater);
//                     req.flash('message', '更新しました');
//                     res.redirect(req.originalUrl);
//                     return;
//                 } catch (error) {
//                     message = error.message;
//                 }
//             }
//         }
//         const forms = {
//             additionalProperty: [],
//             offersStr: (movieTheater.offers !== undefined) ? JSON.stringify(movieTheater.offers, null, '\t') : '{"typeOf":"Offer"}',
//             containsPlaceStr: JSON.stringify(movieTheater.containsPlace, null, '\t'),
//             ...movieTheater,
//             ...req.body
//         };
//         if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
//             forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
//                 return {};
//             }));
//         }
//         res.render('places/movieTheater/update', {
//             message: message,
//             errors: errors,
//             forms: forms
//         });
//     }
// );
// function createFromBody(req: Request): chevre.factory.place.screeningRoom.IPlace {
//     const body = req.body;
//     return {
//         project: req.project,
//         id: body.id,
//         typeOf: chevre.factory.placeType.ScreeningRoom,
//         branchCode: body.branchCode,
//         name: body.name,
//         containsPlace: JSON.parse(body.containsPlaceStr),
//         telephone: body.telephone,
//         additionalProperty: (Array.isArray(body.additionalProperty))
//             ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
//                 .map((p: any) => {
//                     return {
//                         name: String(p.name),
//                         value: String(p.value)
//                     };
//                 })
//             : undefined
//     };
// }
exports.default = screeningRoomRouter;
