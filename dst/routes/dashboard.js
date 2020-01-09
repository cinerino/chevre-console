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
 * ダッシュボードルーター
 */
// import * as chevre from '@chevre/api-nodejs-client';
const express_1 = require("express");
// import { INTERNAL_SERVER_ERROR } from 'http-status';
// import * as moment from 'moment-timezone';
const dashboardRouter = express_1.Router();
dashboardRouter.get('', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));
        return;
    }
    const totalCount = 1;
    const projects = [{
            typeOf: req.project.typeOf,
            id: req.project.id,
            name: req.project.name
        }];
    // プロジェクトが1つのみであれば、プロジェクトホームへ自動遷移
    if (totalCount === 1) {
        res.redirect(`/dashboard/projects/${projects[0].id}/select`);
        return;
    }
    res.render('dashboard', { layout: 'layouts/dashboard' });
}));
/**
 * プロジェクト検索
 */
dashboardRouter.get('/dashboard/projects', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const totalCount = 1;
    const projects = [{
            typeOf: req.project.typeOf,
            id: req.project.id,
            name: req.project.name
        }];
    res.json({
        totalCount: totalCount,
        data: projects
    });
}));
/**
 * プロジェクト選択
 */
dashboardRouter.get('/dashboard/projects/:id/select', (req, res) => __awaiter(this, void 0, void 0, function* () {
    req.project.id = req.params.id;
    res.redirect('/home');
}));
exports.default = dashboardRouter;
