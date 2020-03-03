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
 * 上映イベント管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const ScreeningEventController = require("../../controllers/event/screeningEvent");
const screeningEventRouter = express_1.Router();
screeningEventRouter.get('', ScreeningEventController.index);
screeningEventRouter.get('/getlist', 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventService = new chevre.service.Event({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        const date = req.query.date;
        const movieTheater = yield placeService.findMovieTheaterById({ id: req.query.theater });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield eventService.search(Object.assign({ limit: limit, page: page, project: { ids: [req.project.id] }, typeOf: chevre.factory.eventType.ScreeningEvent, eventStatuses: [chevre.factory.eventStatusType.EventScheduled], inSessionFrom: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                .toDate(), inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                .add(1, 'day')
                .toDate(), superEvent: {
                locationBranchCodes: [movieTheater.branchCode]
            }, offers: {
                itemOffered: {
                    serviceOutput: {
                        reservedTicket: {
                            ticketedSeat: {
                                // 座席指定有のみの検索の場合
                                typeOfs: req.query.onlyReservedSeatsAvailable === '1'
                                    ? [chevre.factory.placeType.Seat]
                                    : undefined
                            }
                        }
                    }
                }
            } }, {
            location: {
                branchCode: {
                    $eq: (typeof req.query.screen === 'string' && req.query.screen.length > 0)
                        ? req.query.screen
                        : undefined
                }
            }
        }));
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
screeningEventRouter.get('/search', ScreeningEventController.search);
screeningEventRouter.get('/searchScreeningEventSeries', ScreeningEventController.searchScreeningEventSeries);
screeningEventRouter.post('/regist', ScreeningEventController.regist);
screeningEventRouter.post('/:eventId/update', ScreeningEventController.update);
screeningEventRouter.put('/:eventId/cancel', ScreeningEventController.cancelPerformance);
screeningEventRouter.get('/:id/offers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventService = new chevre.service.Event({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        const offers = yield eventService.searchTicketOffers({ id: req.params.id });
        res.json(offers);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            message: error.message
        });
    }
}));
/**
 * COAイベントインポート
 */
screeningEventRouter.post('/importFromCOA', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const importFrom = moment()
            .toDate();
        const importThrough = moment(importFrom)
            // tslint:disable-next-line:no-magic-numbers
            .add(2, 'months')
            .toDate();
        const taskAttributes = [{
                project: req.project,
                name: chevre.factory.taskName.ImportEventsFromCOA,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 1,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    locationBranchCode: req.body.theater,
                    importFrom: importFrom,
                    importThrough: importThrough
                }
            }];
        const tasks = yield Promise.all(taskAttributes.map((a) => __awaiter(void 0, void 0, void 0, function* () {
            return taskService.create(a);
        })));
        res.status(http_status_1.CREATED)
            .json(tasks);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningEventRouter;
