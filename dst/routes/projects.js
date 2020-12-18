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
 * プロジェクトルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const cinerinoapi = require("@cinerino/sdk");
const express_1 = require("express");
const moment = require("moment-timezone");
const DEFAULT_EMAIL_SENDER = process.env.DEFAULT_EMAIL_SENDER;
const projectsRouter = express_1.Router();
/**
 * プロジェクト初期化
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get('/initialize', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // プロジェクト作成
        const projectService = new cinerinoapi.service.Project({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });
        const project = yield projectService.findById({ id: req.project.id });
        const chevreProjectService = new chevre.service.Project({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        yield chevreProjectService.create({
            typeOf: chevre.factory.organizationType.Project,
            id: project.id,
            logo: project.logo,
            name: (typeof project.name === 'string') ? project.name : (_a = project.name) === null || _a === void 0 ? void 0 : _a.ja
        });
        res.redirect('/home');
    }
    catch (err) {
        next(err);
    }
}));
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get('/settings', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = '';
        const errors = {};
        const projectService = new chevre.service.Project({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const project = yield projectService.findById({ id: req.project.id });
        const forms = Object.assign({}, project);
        res.render('projects/settings', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
    catch (err) {
        next(err);
    }
}));
projectsRouter.post('/aggregate', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const task = yield taskService.create({
            name: 'aggregateOnProject',
            project: { typeOf: req.project.typeOf, id: req.project.id },
            runsAt: new Date(),
            data: {
                project: { id: req.project.id },
                reservationFor: {
                    startFrom: moment()
                        .tz('Asia/Tokyo')
                        .startOf('month')
                        .toDate(),
                    startThrough: moment()
                        .tz('Asia/Tokyo')
                        .endOf('month')
                        .toDate()
                }
            },
            status: chevre.factory.taskStatus.Ready,
            numberOfTried: 0,
            remainingNumberOfTries: 3,
            executionResults: []
        });
        res.json(task);
    }
    catch (err) {
        next(err);
    }
}));
projectsRouter.post('/createReservationReport', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let eventStartFrom;
        let eventStartThrough;
        eventStartFrom = moment()
            .tz('Asia/Tokyo')
            .add(-1, 'month')
            .startOf('month')
            .toDate();
        eventStartThrough = moment()
            .tz('Asia/Tokyo')
            .add(-1, 'month')
            .endOf('month')
            .toDate();
        const startDay = moment(eventStartFrom)
            .tz('Asia/Tokyo')
            .format('YYYYMMDD');
        const endDay = moment(eventStartThrough)
            .tz('Asia/Tokyo')
            .format('YYYYMMDD');
        const reportName = `ReservationReport[${startDay}-${endDay}]`;
        const expires = moment()
            .add(1, 'day')
            .toDate();
        const recipientEmail = (typeof req.body.recipientEmail === 'string' && req.body.recipientEmail.length > 0)
            ? req.body.recipientEmail
            : req.user.profile.email;
        const taskService = new chevre.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const task = yield taskService.create({
            name: 'createReservationReport',
            project: { typeOf: req.project.typeOf, id: req.project.id },
            runsAt: new Date(),
            data: {
                typeOf: 'CreateAction',
                project: { typeOf: req.project.typeOf, id: req.project.id },
                agent: {
                    typeOf: cinerinoapi.factory.personType.Person,
                    id: req.user.profile.sub,
                    familyName: req.user.profile.family_name,
                    givenName: req.user.profile.given_name,
                    name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                },
                // recipient: { name: 'recipientName' },
                object: {
                    typeOf: 'Report',
                    about: reportName,
                    mentions: {
                        typeOf: 'SearchAction',
                        query: {
                            reservationFor: Object.assign(Object.assign({}, (eventStartFrom instanceof Date) ? { startFrom: eventStartFrom } : undefined), (eventStartThrough instanceof Date) ? { startThrough: eventStartThrough } : undefined)
                        },
                        object: {
                            typeOf: 'Reservation'
                        }
                    },
                    encodingFormat: 'text/csv',
                    expires: expires
                },
                potentialActions: {
                    sendEmailMessage: [
                        {
                            object: {
                                about: `レポートが使用可能です [${req.project.id}]`,
                                sender: {
                                    name: `Chevre Report [${req.project.id}]`,
                                    email: (typeof DEFAULT_EMAIL_SENDER === 'string' && DEFAULT_EMAIL_SENDER.length > 0)
                                        ? DEFAULT_EMAIL_SENDER
                                        : 'noreply@example.com'
                                },
                                toRecipient: { email: recipientEmail }
                            }
                        }
                    ]
                }
            },
            status: chevre.factory.taskStatus.Ready,
            numberOfTried: 0,
            remainingNumberOfTries: 3,
            executionResults: []
        });
        res.json(task);
    }
    catch (err) {
        next(err);
    }
}));
exports.default = projectsRouter;
