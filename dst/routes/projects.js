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
        res.redirect(`/projects/${project.id}/home`);
    }
    catch (err) {
        next(err);
    }
}));
exports.default = projectsRouter;
