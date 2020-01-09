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
 * プロジェクトホームルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const homeRouter = express_1.Router();
homeRouter.get('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));
        return;
    }
    res.render('index', {});
}));
homeRouter.get('/reservationCount', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            limit: 1,
            project: { ids: [req.project.id] },
            typeOf: chevre.factory.reservationType.EventReservation,
            reservationStatuses: [chevre.factory.reservationStatusType.ReservationConfirmed],
            bookingFrom: moment().tz('Asia/Tokyo').startOf('day').toDate(),
            bookingThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
        };
        const result = yield reservationService.search(searchConditions);
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/dbStats', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const stats = yield eventService.fetch({
            uri: '/stats/dbStats',
            method: 'GET',
            // tslint:disable-next-line:no-magic-numbers
            expectedStatusCodes: [200]
        }).then((response) => __awaiter(this, void 0, void 0, function* () {
            return response.json();
        }));
        res.json(stats);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/health', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const stats = yield eventService.fetch({
            uri: '/health',
            method: 'GET',
            // tslint:disable-next-line:no-magic-numbers
            expectedStatusCodes: [200]
        }).then((response) => __awaiter(this, void 0, void 0, function* () {
            const version = response.headers.get('X-API-Version');
            return {
                version: version,
                status: yield response.text()
            };
        }));
        res.json(stats);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/queueCount', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = yield taskService.search({
            limit: 1,
            project: { ids: [req.project.id] },
            runsFrom: moment().add(-1, 'day').toDate(),
            runsThrough: moment().toDate(),
            statuses: [chevre.factory.taskStatus.Ready]
        });
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/latestReservations', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = yield reservationService.search({
            limit: 10,
            page: 1,
            sort: { modifiedTime: chevre.factory.sortType.Descending },
            project: { ids: [req.project.id] },
            typeOf: chevre.factory.reservationType.EventReservation,
            reservationStatuses: [
                chevre.factory.reservationStatusType.ReservationConfirmed,
                chevre.factory.reservationStatusType.ReservationPending
            ],
            modifiedFrom: moment().add(-1, 'day').toDate()
        });
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/eventsWithAggregations', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = yield eventService.searchWithAggregateReservation({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            limit: 10,
            page: 1,
            sort: { startDate: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] },
            inSessionFrom: moment().add().toDate(),
            inSessionThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
        });
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            error: { message: error.message }
        });
    }
}));
exports.default = homeRouter;
