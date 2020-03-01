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
 * 劇場ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
const movieTheaterRouter = express_1.Router();
movieTheaterRouter.all('/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        // validate(req, 'add');
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                debug(req.body);
                req.body.id = '';
                const movieTheater = createMovieTheaterFromBody(req);
                const placeService = new chevre.service.Place({
                    endpoint: process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                const { data } = yield placeService.searchMovieTheaters({});
                const existingMovieTheater = data.find((d) => d.branchCode === movieTheater.branchCode);
                if (existingMovieTheater !== undefined) {
                    throw new Error('枝番号が重複しています');
                }
                debug('existingMovieTheater:', existingMovieTheater);
                yield placeService.createMovieTheater(movieTheater);
                req.flash('message', '登録しました');
                res.redirect(`/places/movieTheater/${movieTheater.branchCode}/update`);
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
    res.render('places/movieTheater/new', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
movieTheaterRouter.get('', (_, res) => {
    res.render('places/movieTheater/index', {
        message: ''
    });
});
movieTheaterRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            return Object.assign(Object.assign({}, movieTheater), { availabilityStartsGraceTimeInDays: (movieTheater.offers !== undefined
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
movieTheaterRouter.all('/:id/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let movieTheater = yield placeService.findMovieTheaterById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        // validate(req, 'update');
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                req.body.id = req.params.id;
                movieTheater = createMovieTheaterFromBody(req);
                debug('saving an movie theater...', movieTheater);
                yield placeService.updateMovieTheater(movieTheater);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign({ additionalProperty: [], 
        // tslint:disable-next-line:no-null-keyword
        offersStr: (movieTheater.offers !== undefined) ? JSON.stringify(movieTheater.offers, null, '\t') : '{"typeOf":"Offer"}', 
        // tslint:disable-next-line:no-null-keyword
        containsPlaceStr: JSON.stringify(movieTheater.containsPlace, null, '\t') }, movieTheater), req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('places/movieTheater/update', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
movieTheaterRouter.get('/:id/screeningRooms', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const movieTheater = yield placeService.findMovieTheaterById({
            id: req.params.id
        });
        const screeningRooms = movieTheater.containsPlace.map((screen) => {
            let numSeats = 0;
            if (screen.containsPlace !== undefined) {
                numSeats += screen.containsPlace.reduce((a, b) => {
                    return a + ((b.containsPlace !== undefined) ? b.containsPlace.length : 0);
                }, 0);
            }
            return Object.assign(Object.assign({}, screen), { name: screen.name !== undefined
                    ? (typeof screen.name === 'string') ? screen.name : screen.name.ja
                    : '', numSeats: numSeats });
        });
        screeningRooms.sort((screen1, screen2) => {
            if (typeof screen1.name === 'string' && screen2.name === 'strring') {
                if (screen1.name > screen2.name) {
                    return 1;
                }
                if (screen1.name < screen2.name) {
                    return -1;
                }
            }
            return 0;
        });
        res.json({
            success: true,
            results: screeningRooms
        });
    }
    catch (err) {
        res.json({
            success: false,
            message: err.message,
            results: []
        });
    }
}));
function createMovieTheaterFromBody(req) {
    const body = req.body;
    // tslint:disable-next-line:no-unnecessary-local-variable
    const movieTheater = {
        project: req.project,
        id: body.id,
        typeOf: chevre.factory.placeType.MovieTheater,
        branchCode: body.branchCode,
        name: body.name,
        kanaName: body.kanaName,
        offers: JSON.parse(body.offersStr),
        containsPlace: JSON.parse(body.containsPlaceStr),
        telephone: body.telephone,
        screenCount: 0,
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                .map((p) => {
                return {
                    name: String(p.name),
                    value: String(p.value)
                };
            })
            : undefined
    };
    return movieTheater;
}
exports.default = movieTheaterRouter;
