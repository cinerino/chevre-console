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
const projectsRouter = express_1.Router();
/**
 * プロジェクト初期化
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get('/initialize', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
            name: project.name
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
exports.default = projectsRouter;
