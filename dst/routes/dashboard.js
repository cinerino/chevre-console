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
 * ダッシュボードルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const cinerinoapi = require("@cinerino/sdk");
const express_1 = require("express");
const http_status_1 = require("http-status");
const dashboardRouter = express_1.Router();
/**
 * ダッシュボード
 */
dashboardRouter.get('', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));
            return;
        }
        if (typeof process.env.PROJECT_ID === 'string') {
            res.redirect(`/dashboard/projects/${process.env.PROJECT_ID}/select`);
            return;
        }
        // 管理プロジェクト検索
        const projectService = new cinerinoapi.service.Project({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });
        const { data } = yield projectService.search({});
        // プロジェクトが1つのみであれば、プロジェクトホームへ自動遷移
        if (data.length === 1) {
            res.redirect(`/dashboard/projects/${data[0].id}/select`);
            return;
        }
        res.render('dashboard', { layout: 'layouts/dashboard' });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロジェクト検索
 */
dashboardRouter.get('/dashboard/projects', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 管理プロジェクト検索
        const projectService = new cinerinoapi.service.Project({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchProjectsResult = yield projectService.search({});
        res.json(searchProjectsResult);
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .send(error.message);
    }
}));
/**
 * プロジェクト選択
 */
dashboardRouter.get('/dashboard/projects/:id/select', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.id;
        // (<any>req.session).projectId = projectId;
        // サブスクリプション決定
        const projectService = new cinerinoapi.service.Project({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });
        const project = yield projectService.findById({ id: projectId });
        req.session.project = project;
        try {
            const chevreProjectService = new chevre.service.Project({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            yield chevreProjectService.findById({ id: project.id });
            // let subscriptionIdentifier = chevreProject.subscription?.identifier;
            // if (subscriptionIdentifier === undefined) {
            //     subscriptionIdentifier = 'Free';
            // }
            // (<any>req.session).subscriptionIdentifier = subscriptionIdentifier;
        }
        catch (error) {
            // プロジェクト未作成であれば初期化プロセスへ
            if (error.code === http_status_1.NOT_FOUND) {
                res.redirect(`/projects/${project.id}/initialize`);
                return;
            }
            throw error;
        }
        res.redirect(`/projects/${project.id}/home`);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = dashboardRouter;
