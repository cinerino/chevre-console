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
 * 座席ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
const seatRouter = express_1.Router();
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
seatRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
        project: { ids: [req.project.id] }
    });
    res.render('places/seat/index', {
        message: '',
        movieTheaters: searchMovieTheatersResult.data
    });
}));
seatRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield placeService.searchSeats({
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            branchCode: {
                $eq: (typeof ((_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.branchCode) === null || _b === void 0 ? void 0 : _b.$eq) === 'string'
                    && ((_d = (_c = req.query) === null || _c === void 0 ? void 0 : _c.branchCode) === null || _d === void 0 ? void 0 : _d.$eq.length) > 0)
                    ? (_f = (_e = req.query) === null || _e === void 0 ? void 0 : _e.branchCode) === null || _f === void 0 ? void 0 : _f.$eq : undefined
            },
            containedInPlace: {
                containedInPlace: {
                    containedInPlace: {
                        branchCode: {
                            $eq: (typeof ((_l = (_k = (_j = (_h = (_g = req.query) === null || _g === void 0 ? void 0 : _g.containedInPlace) === null || _h === void 0 ? void 0 : _h.containedInPlace) === null || _j === void 0 ? void 0 : _j.containedInPlace) === null || _k === void 0 ? void 0 : _k.branchCode) === null || _l === void 0 ? void 0 : _l.$eq) === 'string'
                                && ((_r = (_q = (_p = (_o = (_m = req.query) === null || _m === void 0 ? void 0 : _m.containedInPlace) === null || _o === void 0 ? void 0 : _o.containedInPlace) === null || _p === void 0 ? void 0 : _p.containedInPlace) === null || _q === void 0 ? void 0 : _q.branchCode) === null || _r === void 0 ? void 0 : _r.$eq.length) > 0)
                                ? (_w = (_v = (_u = (_t = (_s = req.query) === null || _s === void 0 ? void 0 : _s.containedInPlace) === null || _t === void 0 ? void 0 : _t.containedInPlace) === null || _u === void 0 ? void 0 : _u.containedInPlace) === null || _v === void 0 ? void 0 : _v.branchCode) === null || _w === void 0 ? void 0 : _w.$eq : undefined
                        }
                    }
                }
            }
            // name: req.query.name
        });
        const results = data.map((seat, index) => {
            return Object.assign(Object.assign({}, seat), { seatingTypeStr: (Array.isArray(seat.seatingType)) ? seat.seatingType.join(',') : '', id: `${seat.branchCode}:${index}` });
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
seatRouter.all('/:id/update', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let message = '';
        let errors = {};
        const splittedId = req.params.id.split(':');
        const movieTheaterBranchCode = splittedId[0];
        const screeningRoomBranchCode = splittedId[1];
        // tslint:disable-next-line:no-magic-numbers
        const screeningRoomSectionBranchCode = splittedId[2];
        // tslint:disable-next-line:no-magic-numbers
        const seatBranchCode = splittedId[3];
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });
        const searchSeatingTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });
        const searchSeatsResult = yield placeService.searchSeats({
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
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    seat = createFromBody(req, false);
                    debug('saving seat...', seat);
                    yield placeService.updateSeat(seat);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign({ additionalProperty: [] }, seat), req.body);
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
    }
    catch (error) {
        next(error);
    }
}));
function createFromBody(req, isNew) {
    let seatingType;
    if (typeof req.body.seatingType === 'string' && req.body.seatingType.length > 0) {
        seatingType = [req.body.seatingType];
    }
    return Object.assign(Object.assign({ project: req.project, typeOf: chevre.factory.placeType.Seat, branchCode: req.body.branchCode, containedInPlace: {
            project: req.project,
            typeOf: chevre.factory.placeType.ScreeningRoomSection,
            branchCode: req.body.containedInPlace.branchCode,
            containedInPlace: {
                project: req.project,
                typeOf: chevre.factory.placeType.ScreeningRoom,
                branchCode: req.body.containedInPlace.containedInPlace.branchCode,
                containedInPlace: {
                    project: req.project,
                    typeOf: chevre.factory.placeType.MovieTheater,
                    branchCode: req.body.containedInPlace.containedInPlace.containedInPlace.branchCode
                }
            }
        }, additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                .map((p) => {
                return {
                    name: String(p.name),
                    value: String(p.value)
                };
            })
            : undefined }, (Array.isArray(seatingType)) ? { seatingType: seatingType } : undefined), (!isNew)
        ? {
            $unset: Object.assign({ noExistingAttributeName: 1 }, (seatingType === undefined)
                ? { 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType': 1 }
                : undefined)
        }
        : undefined);
}
exports.default = seatRouter;
