"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * スクリーンルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
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
screeningRoomRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
        project: { ids: [req.project.id] }
    });
    res.render('places/screeningRoom/index', {
        message: '',
        movieTheaters: searchMovieTheatersResult.data
    });
}));
screeningRoomRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield placeService.searchScreeningRooms({
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            containedInPlace: {
                branchCode: {
                    $eq: (typeof ((_c = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.containedInPlace) === null || _b === void 0 ? void 0 : _b.branchCode) === null || _c === void 0 ? void 0 : _c.$eq) === 'string'
                        && ((_f = (_e = (_d = req.query) === null || _d === void 0 ? void 0 : _d.containedInPlace) === null || _e === void 0 ? void 0 : _e.branchCode) === null || _f === void 0 ? void 0 : _f.$eq.length) > 0)
                        ? (_j = (_h = (_g = req.query) === null || _g === void 0 ? void 0 : _g.containedInPlace) === null || _h === void 0 ? void 0 : _h.branchCode) === null || _j === void 0 ? void 0 : _j.$eq : undefined
                }
            }
            // name: req.query.name
        });
        const results = data.map((screeningRoom) => {
            return Object.assign({}, screeningRoom);
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
screeningRoomRouter.all('/:id/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const splittedId = req.params.id.split(':');
    const movieTheaterBranchCode = splittedId[0];
    const screeningRoomBranchCode = splittedId[1];
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
        project: { ids: [req.project.id] }
    });
    const searchScreeningRoomsResult = yield placeService.searchScreeningRooms({
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
        // validate(req, 'update');
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                screeningRoom = createFromBody(req, false);
                debug('saving screeningRoom...', screeningRoom);
                yield placeService.updateScreeningRoom(screeningRoom);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                console.error(error);
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign({ additionalProperty: [] }, screeningRoom), req.body);
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
}));
function createFromBody(req, isNew) {
    const body = req.body;
    let openSeatingAllowed;
    if (body.openSeatingAllowed === '1') {
        openSeatingAllowed = true;
    }
    return Object.assign(Object.assign({ project: req.project, typeOf: chevre.factory.placeType.ScreeningRoom, branchCode: body.branchCode, name: body.name, address: body.address, containedInPlace: {
            project: req.project,
            typeOf: chevre.factory.placeType.MovieTheater,
            branchCode: body.containedInPlace.branchCode
        }, containsPlace: [], additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                .map((p) => {
                return {
                    name: String(p.name),
                    value: String(p.value)
                };
            })
            : undefined }, (typeof openSeatingAllowed === 'boolean')
        ? { openSeatingAllowed: openSeatingAllowed }
        : undefined), (!isNew)
        ? {
            $unset: Object.assign({ noExistingAttributeName: 1 }, (openSeatingAllowed === undefined) ? { 'containsPlace.$[screeningRoom].openSeatingAllowed': 1 } : undefined)
        }
        : undefined);
}
exports.default = screeningRoomRouter;
