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
 * プロジェクトホームルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const cinerinoapi = require("@cinerino/sdk");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const homeRouter = express_1.Router();
homeRouter.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));
            return;
        }
        const roleNames = yield searchRoleNames(req);
        res.render('home', { roleNames });
    }
    catch (error) {
        next(error);
    }
}));
function searchRoleNames(req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let roleNames = [];
        try {
            // 自分のロールを確認
            const iamService = new cinerinoapi.service.IAM({
                endpoint: process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: (_a = req.project) === null || _a === void 0 ? void 0 : _a.id }
            });
            const member = yield iamService.findMemberById({ member: { id: 'me' } });
            // const searchMembersResult = await iamService.searchMembers({
            //     limit: 1,
            //     member: {
            //         typeOf: { $eq: cinerinoapi.factory.personType.Person },
            //         id: { $eq: req.user.profile.sub }
            //     }
            // });
            roleNames = member.member.hasRole
                .map((r) => r.roleName);
            // if (!Array.isArray(roleNames)) {
            //     roleNames = [];
            // }
        }
        catch (error) {
            console.error(error);
        }
        return roleNames;
    });
}
homeRouter.get('/projectAggregation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectService = new chevre.service.Project({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: '' }
        });
        const project = yield projectService.findById({ id: req.project.id });
        res.json(project);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/dbStats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const stats = yield eventService.fetch({
            uri: '/stats/dbStats',
            method: 'GET',
            // tslint:disable-next-line:no-magic-numbers
            expectedStatusCodes: [200]
        })
            .then((response) => __awaiter(void 0, void 0, void 0, function* () {
            return response.json();
        }));
        res.json(stats);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const stats = yield eventService.fetch({
            uri: '/health',
            method: 'GET',
            // tslint:disable-next-line:no-magic-numbers
            expectedStatusCodes: [200]
        })
            .then((response) => __awaiter(void 0, void 0, void 0, function* () {
            const version = response.headers.get('X-API-Version');
            return {
                version: version,
                status: yield response.text()
            };
        }));
        res.json(stats);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/queueCount', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const result = yield taskService.search({
            limit: 1,
            project: { ids: [req.project.id] },
            runsFrom: moment()
                .add(-1, 'day')
                .toDate(),
            runsThrough: moment()
                .toDate(),
            statuses: [chevre.factory.taskStatus.Ready]
        });
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/latestReservations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const result = yield reservationService.search({
            limit: 10,
            page: 1,
            project: { ids: [req.project.id] },
            typeOf: chevre.factory.reservationType.EventReservation,
            reservationStatuses: [
                chevre.factory.reservationStatusType.ReservationConfirmed,
                chevre.factory.reservationStatusType.ReservationPending
            ],
            bookingFrom: moment()
                .add(-1, 'day')
                .toDate()
        });
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/eventsWithAggregations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const result = yield eventService.search(Object.assign({ typeOf: chevre.factory.eventType.ScreeningEvent, limit: 10, page: 1, eventStatuses: [chevre.factory.eventStatusType.EventScheduled], sort: { startDate: chevre.factory.sortType.Ascending }, project: { ids: [req.project.id] }, inSessionFrom: moment()
                .add()
                .toDate(), inSessionThrough: moment()
                .tz('Asia/Tokyo')
                .endOf('day')
                .toDate() }, {
            countDocuments: '1'
        }));
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
homeRouter.get('/errorReporting', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const runsThrough = moment()
            .toDate();
        const result = yield taskService.search({
            limit: 10,
            page: 1,
            project: { ids: [req.project.id] },
            statuses: [chevre.factory.taskStatus.Aborted],
            runsFrom: moment(runsThrough)
                .add(-1, 'day')
                .toDate(),
            runsThrough: runsThrough
        });
        res.json(result);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            error: { message: error.message }
        });
    }
}));
exports.default = homeRouter;
