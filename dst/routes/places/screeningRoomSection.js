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
 * スクリーンセクションルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const csvtojson = require("csvtojson");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const Message = require("../../message");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 5;
const screeningRoomSectionRouter = express_1.Router();
screeningRoomSectionRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    let message = '';
    let errors = {};
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
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
                const screeningRoomSection = yield createFromBody(req, true);
                // const { data } = await placeService.searchScreeningRooms({});
                // const existingMovieTheater = data.find((d) => d.branchCode === screeningRoom.branchCode);
                // if (existingMovieTheater !== undefined) {
                //     throw new Error('枝番号が重複しています');
                // }
                yield placeService.createScreeningRoomSection(screeningRoomSection);
                req.flash('message', '登録しました');
                res.redirect(`/places/screeningRoomSection/${(_b = (_a = screeningRoomSection.containedInPlace) === null || _a === void 0 ? void 0 : _a.containedInPlace) === null || _b === void 0 ? void 0 : _b.branchCode}:${(_c = screeningRoomSection.containedInPlace) === null || _c === void 0 ? void 0 : _c.branchCode}:${screeningRoomSection.branchCode}/update`);
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
    const searchSeatingTypesResult = yield categoryCodeService.search({
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
}));
screeningRoomSectionRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
        project: { ids: [req.project.id] }
    });
    res.render('places/screeningRoomSection/index', {
        message: '',
        movieTheaters: searchMovieTheatersResult.data
    });
}));
screeningRoomSectionRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield placeService.searchScreeningRoomSections({
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            branchCode: {
                $regex: (typeof ((_e = (_d = req.query) === null || _d === void 0 ? void 0 : _d.branchCode) === null || _e === void 0 ? void 0 : _e.$eq) === 'string'
                    && ((_g = (_f = req.query) === null || _f === void 0 ? void 0 : _f.branchCode) === null || _g === void 0 ? void 0 : _g.$eq.length) > 0)
                    ? (_j = (_h = req.query) === null || _h === void 0 ? void 0 : _h.branchCode) === null || _j === void 0 ? void 0 : _j.$eq : undefined
            },
            containedInPlace: {
                branchCode: {
                    $eq: (typeof ((_m = (_l = (_k = req.query) === null || _k === void 0 ? void 0 : _k.containedInPlace) === null || _l === void 0 ? void 0 : _l.branchCode) === null || _m === void 0 ? void 0 : _m.$eq) === 'string'
                        && ((_q = (_p = (_o = req.query) === null || _o === void 0 ? void 0 : _o.containedInPlace) === null || _p === void 0 ? void 0 : _p.branchCode) === null || _q === void 0 ? void 0 : _q.$eq.length) > 0)
                        ? (_t = (_s = (_r = req.query) === null || _r === void 0 ? void 0 : _r.containedInPlace) === null || _s === void 0 ? void 0 : _s.branchCode) === null || _t === void 0 ? void 0 : _t.$eq : undefined
                },
                containedInPlace: {
                    branchCode: {
                        $eq: (typeof ((_x = (_w = (_v = (_u = req.query) === null || _u === void 0 ? void 0 : _u.containedInPlace) === null || _v === void 0 ? void 0 : _v.containedInPlace) === null || _w === void 0 ? void 0 : _w.branchCode) === null || _x === void 0 ? void 0 : _x.$eq) === 'string'
                            && ((_1 = (_0 = (_z = (_y = req.query) === null || _y === void 0 ? void 0 : _y.containedInPlace) === null || _z === void 0 ? void 0 : _z.containedInPlace) === null || _0 === void 0 ? void 0 : _0.branchCode) === null || _1 === void 0 ? void 0 : _1.$eq.length) > 0)
                            ? (_5 = (_4 = (_3 = (_2 = req.query) === null || _2 === void 0 ? void 0 : _2.containedInPlace) === null || _3 === void 0 ? void 0 : _3.containedInPlace) === null || _4 === void 0 ? void 0 : _4.branchCode) === null || _5 === void 0 ? void 0 : _5.$eq : undefined
                    }
                }
            },
            name: {
                $regex: (typeof ((_7 = (_6 = req.query) === null || _6 === void 0 ? void 0 : _6.name) === null || _7 === void 0 ? void 0 : _7.$regex) === 'string'
                    && ((_9 = (_8 = req.query) === null || _8 === void 0 ? void 0 : _8.name) === null || _9 === void 0 ? void 0 : _9.$regex.length) > 0)
                    ? (_11 = (_10 = req.query) === null || _10 === void 0 ? void 0 : _10.name) === null || _11 === void 0 ? void 0 : _11.$regex : undefined
            }
        });
        const results = data.map((seat, index) => {
            return Object.assign(Object.assign({}, seat), { id: `${seat.branchCode}:${index}` });
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
// tslint:disable-next-line:use-default-type-parameter
screeningRoomSectionRouter.all('/:id/update', ...validate(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let message = '';
        let errors = {};
        const splittedId = req.params.id.split(':');
        const movieTheaterBranchCode = splittedId[0];
        const screeningRoomBranchCode = splittedId[1];
        // tslint:disable-next-line:no-magic-numbers
        const screeningRoomSectionBranchCode = splittedId[2];
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = yield placeService.searchMovieTheaters({
            project: { ids: [req.project.id] }
        });
        const searchScreeningRoomSectionsResult = yield placeService.searchScreeningRoomSections({
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
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    screeningRoomSection = yield createFromBody(req, false);
                    yield placeService.updateScreeningRoomSection(screeningRoomSection);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign(Object.assign({ additionalProperty: [] }, screeningRoomSection), req.body), { containedInPlace: screeningRoomSection.containedInPlace });
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
    }
    catch (error) {
        next(error);
    }
}));
// tslint:disable-next-line:use-default-type-parameter
screeningRoomSectionRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const splittedId = req.params.id.split(':');
    const movieTheaterBranchCode = splittedId[0];
    const screeningRoomBranchCode = splittedId[1];
    // tslint:disable-next-line:no-magic-numbers
    const screeningRoomSectionBranchCode = splittedId[2];
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    yield placeService.deleteScreeningRoomSection({
        project: { id: req.project.id },
        branchCode: screeningRoomSectionBranchCode,
        containedInPlace: {
            branchCode: screeningRoomBranchCode,
            containedInPlace: {
                branchCode: movieTheaterBranchCode
            }
        }
    });
    res.status(http_status_1.NO_CONTENT)
        .end();
}));
function createFromBody(req, isNew) {
    return __awaiter(this, void 0, void 0, function* () {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchSeatingTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });
        const seatingTypes = searchSeatingTypesResult.data;
        let containsPlace = [];
        const containsPlaceCsv = req.body.containsPlace;
        const seatBranchCodeRegex = /^[0-9a-zA-Z\-]+$/;
        if (typeof containsPlaceCsv === 'string' && containsPlaceCsv.length > 0) {
            // tslint:disable-next-line:await-promise
            const containsPlaceFronCsv = yield csvtojson()
                .fromString(containsPlaceCsv);
            if (Array.isArray(containsPlaceFronCsv)) {
                containsPlace = containsPlaceFronCsv.filter((p) => {
                    return typeof p.branchCode === 'string'
                        && p.branchCode.length > 0
                        && seatBranchCodeRegex.test(p.branchCode);
                })
                    .map((p) => {
                    var _a;
                    let seatingTypeCodeValue;
                    if (typeof p.seatingType === 'string') {
                        seatingTypeCodeValue = (_a = seatingTypes.find((s) => s.codeValue === p.seatingType)) === null || _a === void 0 ? void 0 : _a.codeValue;
                    }
                    return {
                        project: { typeOf: req.project.typeOf, id: req.project.id },
                        typeOf: chevre.factory.placeType.Seat,
                        branchCode: p.branchCode,
                        seatingType: (typeof seatingTypeCodeValue === 'string') ? [seatingTypeCodeValue] : [],
                        additionalProperty: []
                    };
                });
            }
        }
        return Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: chevre.factory.placeType.ScreeningRoomSection, branchCode: req.body.branchCode, name: req.body.name, containedInPlace: {
                project: { typeOf: req.project.typeOf, id: req.project.id },
                typeOf: chevre.factory.placeType.ScreeningRoom,
                branchCode: req.body.containedInPlace.branchCode,
                containedInPlace: {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: chevre.factory.placeType.MovieTheater,
                    branchCode: req.body.containedInPlace.containedInPlace.branchCode
                }
            }, containsPlace: containsPlace, additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined }, (!isNew)
            ? {
                $unset: {
                    noExistingAttributeName: 1 // $unsetは空だとエラーになるので
                    // ...(seatingType === undefined)
                    //     ? { 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType': 1 }
                    //     : undefined
                }
            }
            : undefined);
    });
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
        express_validator_1.body('containedInPlace.containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '劇場')),
        express_validator_1.body('containedInPlace.branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'スクリーン')),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 64)),
        express_validator_1.body('name.en')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称(English)', 64))
    ];
}
exports.default = screeningRoomSectionRouter;
