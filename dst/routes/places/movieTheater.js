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
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const Message = require("../../message");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
const movieTheaterRouter = express_1.Router();
movieTheaterRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                debug(req.body);
                req.body.id = '';
                let movieTheater = createMovieTheaterFromBody(req);
                const placeService = new chevre.service.Place({
                    endpoint: process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                const { data } = yield placeService.searchMovieTheaters({
                    limit: 100,
                    project: { ids: [req.project.id] }
                });
                const existingMovieTheater = data.find((d) => d.branchCode === movieTheater.branchCode);
                if (existingMovieTheater !== undefined) {
                    throw new Error('枝番号が重複しています');
                }
                debug('existingMovieTheater:', existingMovieTheater);
                movieTheater = yield placeService.createMovieTheater(movieTheater);
                req.flash('message', '登録しました');
                res.redirect(`/places/movieTheater/${movieTheater.id}/update`);
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
            return Object.assign(Object.assign({}, movieTheater), { posCount: (Array.isArray(movieTheater.hasPOS)) ? movieTheater.hasPOS.length : 0, availabilityStartsGraceTimeInDays: (movieTheater.offers !== undefined
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
movieTheaterRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        yield placeService.deleteMovieTheater({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        res.status(http_status_1.BAD_REQUEST)
            .json({ error: { message: error.message } });
    }
}));
// tslint:disable-next-line:use-default-type-parameter
movieTheaterRouter.all('/:id/update', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
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
            if (Array.isArray(screen.containsPlace)) {
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
    // tslint:disable-next-line:no-unnecessary-local-variable
    const movieTheater = {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        id: req.body.id,
        typeOf: chevre.factory.placeType.MovieTheater,
        branchCode: req.body.branchCode,
        name: req.body.name,
        kanaName: req.body.kanaName,
        offers: JSON.parse(req.body.offersStr),
        containsPlace: JSON.parse(req.body.containsPlaceStr),
        telephone: req.body.telephone,
        screenCount: 0,
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
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
exports.default = movieTheaterRouter;
