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
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const Message = require("../../message");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
const screeningRoomRouter = express_1.Router();
screeningRoomRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let message = '';
    let errors = {};
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
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
                yield placeService.createScreeningRoom(screeningRoom);
                req.flash('message', '登録しました');
                res.redirect(`/places/screeningRoom/${(_a = screeningRoom.containedInPlace) === null || _a === void 0 ? void 0 : _a.branchCode}:${screeningRoom.branchCode}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [], name: {} }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
        project: { ids: [req.project.id] }
    });
    res.render('places/screeningRoom/new', {
        message: message,
        errors: errors,
        forms: forms,
        movieTheaters: searchMovieTheatersResult.data
    });
}));
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
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
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
            branchCode: {
                $regex: (typeof ((_c = (_b = req.query) === null || _b === void 0 ? void 0 : _b.branchCode) === null || _c === void 0 ? void 0 : _c.$regex) === 'string'
                    && ((_e = (_d = req.query) === null || _d === void 0 ? void 0 : _d.branchCode) === null || _e === void 0 ? void 0 : _e.$regex.length) > 0)
                    ? (_g = (_f = req.query) === null || _f === void 0 ? void 0 : _f.branchCode) === null || _g === void 0 ? void 0 : _g.$regex : undefined
            },
            containedInPlace: {
                branchCode: {
                    $eq: (typeof ((_k = (_j = (_h = req.query) === null || _h === void 0 ? void 0 : _h.containedInPlace) === null || _j === void 0 ? void 0 : _j.branchCode) === null || _k === void 0 ? void 0 : _k.$eq) === 'string'
                        && ((_o = (_m = (_l = req.query) === null || _l === void 0 ? void 0 : _l.containedInPlace) === null || _m === void 0 ? void 0 : _m.branchCode) === null || _o === void 0 ? void 0 : _o.$eq.length) > 0)
                        ? (_r = (_q = (_p = req.query) === null || _p === void 0 ? void 0 : _p.containedInPlace) === null || _q === void 0 ? void 0 : _q.branchCode) === null || _r === void 0 ? void 0 : _r.$eq : undefined
                }
            },
            name: {
                $regex: (typeof ((_t = (_s = req.query) === null || _s === void 0 ? void 0 : _s.name) === null || _t === void 0 ? void 0 : _t.$regex) === 'string'
                    && ((_v = (_u = req.query) === null || _u === void 0 ? void 0 : _u.name) === null || _v === void 0 ? void 0 : _v.$regex.length) > 0)
                    ? (_x = (_w = req.query) === null || _w === void 0 ? void 0 : _w.name) === null || _x === void 0 ? void 0 : _x.$regex : undefined
            }
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
            message: err.message,
            success: false,
            count: 0,
            results: []
        });
    }
}));
// tslint:disable-next-line:use-default-type-parameter
screeningRoomRouter.all('/:id/update', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
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
// tslint:disable-next-line:use-default-type-parameter
screeningRoomRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const splittedId = req.params.id.split(':');
    const movieTheaterBranchCode = splittedId[0];
    const screeningRoomBranchCode = splittedId[1];
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    yield placeService.deleteScreeningRoom({
        project: req.project,
        branchCode: screeningRoomBranchCode,
        containedInPlace: { branchCode: movieTheaterBranchCode }
    });
    res.status(http_status_1.NO_CONTENT)
        .end();
}));
function createFromBody(req, isNew) {
    let openSeatingAllowed;
    if (req.body.openSeatingAllowed === '1') {
        openSeatingAllowed = true;
    }
    return Object.assign(Object.assign({ project: req.project, typeOf: chevre.factory.placeType.ScreeningRoom, branchCode: req.body.branchCode, name: req.body.name, address: req.body.address, containedInPlace: {
            project: req.project,
            typeOf: chevre.factory.placeType.MovieTheater,
            branchCode: req.body.containedInPlace.branchCode
        }, containsPlace: [], additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
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
function validate() {
    return [
        express_validator_1.body('branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '枝番号'))
            .matches(/^[0-9a-zA-Z]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('枝番号', 20)),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 64))
    ];
}
exports.default = screeningRoomRouter;
