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
 * 上映イベントシリーズマスタ管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
// import * as createDebug from 'debug';
const express_1 = require("express");
const http_status_1 = require("http-status");
// import * as Message from '../../message';
const ScreeningEventSeriesController = require("../../controllers/event/screeningEventSeries");
const screeningEventSeriesRouter = express_1.Router();
screeningEventSeriesRouter.all('/add', ScreeningEventSeriesController.add);
screeningEventSeriesRouter.all('', ScreeningEventSeriesController.index);
screeningEventSeriesRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield eventService.search({
            limit: limit,
            page: page,
            sort: { startDate: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] },
            name: req.query.name,
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            endFrom: (req.query.containsEnded === '1') ? undefined : new Date(),
            location: {
                branchCodes: (req.query.locationBranchCode !== '') ? [req.query.locationBranchCode] : undefined
            },
            workPerformed: {
                identifiers: (typeof ((_a = req.query.workPerformed) === null || _a === void 0 ? void 0 : _a.identifier) === 'string' && ((_b = req.query.workPerformed) === null || _b === void 0 ? void 0 : _b.identifier.length) > 0)
                    ? [(_c = req.query.workPerformed) === null || _c === void 0 ? void 0 : _c.identifier]
                    : undefined
            }
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data
        });
    }
    catch (error) {
        res.json({
            success: false,
            count: 0,
            results: error
        });
    }
}));
/**
 * 名前から作品候補を検索する
 */
screeningEventSeriesRouter.get('/searchMovies', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieResult = yield creativeWorkService.searchMovies({
            limit: 100,
            sort: { identifier: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] },
            offers: {
                availableFrom: new Date()
            },
            name: req.query.q
        });
        res.json(searchMovieResult);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            message: error.message
        });
    }
}));
screeningEventSeriesRouter.get('/search', ScreeningEventSeriesController.search);
screeningEventSeriesRouter.all('/:eventId/update', ScreeningEventSeriesController.update);
screeningEventSeriesRouter.get('/:eventId/screeningEvents', ScreeningEventSeriesController.searchScreeningEvents);
exports.default = screeningEventSeriesRouter;
