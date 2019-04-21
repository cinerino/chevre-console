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
 * 劇場ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
const movieTheaterRouter = express_1.Router();
movieTheaterRouter.all('/new', (req, res) => __awaiter(this, void 0, void 0, function* () {
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
movieTheaterRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = yield placeService.searchMovieTheaters({
            limit: req.query.limit,
            page: req.query.page,
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
            count: totalCount,
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
movieTheaterRouter.all('/:branchCode/update', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let movieTheater = yield placeService.findMovieTheaterByBranchCode({
        branchCode: req.params.branchCode
    });
    if (req.method === 'POST') {
        // バリデーション
        // validate(req, 'update');
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
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
    const forms = Object.assign({ additionalProperty: [], offersStr: (movieTheater.offers !== undefined) ? JSON.stringify(movieTheater.offers, null, '\t') : '{"typeOf":"Offer"}', containsPlaceStr: JSON.stringify(movieTheater.containsPlace, null, '\t') }, movieTheater, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
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
movieTheaterRouter.get('/getScreenListByTheaterBranchCode', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const branchCode = req.query.branchCode;
        const place = yield placeService.findMovieTheaterByBranchCode({
            branchCode
        });
        const results = place.containsPlace.map((screen) => ({
            branchCode: screen.branchCode,
            name: screen.name !== undefined ? screen.name.ja : ''
        }));
        results.sort((screen1, screen2) => {
            if (screen1.name > screen2.name) {
                return 1;
            }
            if (screen1.name < screen2.name) {
                return -1;
            }
            return 0;
        });
        res.json({
            success: true,
            results
        });
    }
    catch (err) {
        res.json({
            success: false,
            results: []
        });
    }
}));
function createMovieTheaterFromBody(req) {
    const body = req.body;
    // tslint:disable-next-line:no-unnecessary-local-variable
    const movieTheater = {
        project: req.project,
        id: '',
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
