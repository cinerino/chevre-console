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
 * アプリケーションルーター
 */
const cinerino = require("@cinerino/sdk");
const express_1 = require("express");
const http_status_1 = require("http-status");
const applicationsRouter = express_1.Router();
applicationsRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const iamService = new cinerino.service.IAM({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const limit = 10;
        const page = 1;
        const nameRegex = req.query.name;
        const searchConditions = {
            limit: limit,
            member: {
                typeOf: { $eq: cinerino.factory.chevre.creativeWorkType.WebApplication },
                name: { $regex: (typeof nameRegex === 'string' && nameRegex.length > 0) ? nameRegex : undefined }
            }
        };
        const { data } = yield iamService.searchMembers(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((d) => d.member)
                .sort((a, b) => {
                if (String(a.name) < String(b.name)) {
                    return -1;
                }
                if (String(a.name) > String(b.name)) {
                    return 1;
                }
                return 0;
            })
        });
    }
    catch (err) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            message: err.message
        });
    }
}));
exports.default = applicationsRouter;
