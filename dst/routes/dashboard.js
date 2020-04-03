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
const cinerinoapi = require("@cinerino/api-nodejs-client");
const express_1 = require("express");
const dashboardRouter = express_1.Router();
/**
 * ダッシュボード
 */
dashboardRouter.get('', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
/**
 * プロジェクト検索
 */
dashboardRouter.get('/dashboard/projects', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 管理プロジェクト検索
    const projectService = new cinerinoapi.service.Project({
        endpoint: process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchProjectsResult = yield projectService.search({});
    res.json(searchProjectsResult);
}));
/**
 * プロジェクト選択
 */
dashboardRouter.get('/dashboard/projects/:id/select', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const projectId = req.params.id;
    req.session.projectId = projectId;
    // サブスクリプション決定
    const projectService = new cinerinoapi.service.Project({
        endpoint: process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient
    });
    const project = yield projectService.findById({ id: projectId });
    let subscriptionIdentifier = (_a = project.subscription) === null || _a === void 0 ? void 0 : _a.identifier;
    if (subscriptionIdentifier === undefined) {
        subscriptionIdentifier = 'Business';
    }
    req.session.subscriptionIdentifier = subscriptionIdentifier;
    res.redirect('/home');
}));
exports.default = dashboardRouter;
