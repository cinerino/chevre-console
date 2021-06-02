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
 * 承認ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const moment = require("moment");
const orderStatusType_1 = require("../factory/orderStatusType");
const authorizationsRouter = express_1.Router();
authorizationsRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('authorizations/index', {
        message: '',
        orderStatusTypes: orderStatusType_1.orderStatusTypes
    });
}));
authorizationsRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authorizationService = new chevre.service.Authorization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            project: { id: { $eq: req.project.id } },
            code: {
                $in: (typeof req.query.code === 'string' && req.query.code.length > 0)
                    ? [req.query.code]
                    : undefined
            },
            validFrom: (typeof req.query.validFrom === 'string' && req.query.validFrom.length > 0)
                ? moment(`${String(req.query.validFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                    .toDate()
                : undefined,
            validThrough: (typeof req.query.validThrough === 'string' && req.query.validThrough.length > 0)
                ? moment(`${String(req.query.validThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                    .add(1, 'day')
                    .toDate()
                : undefined,
            object: {
                typeOfs: (typeof ((_a = req.query.object) === null || _a === void 0 ? void 0 : _a.typeOf) === 'string' && req.query.object.typeOf.length > 0)
                    ? [req.query.object.typeOf]
                    : undefined,
                ids: (typeof ((_b = req.query.object) === null || _b === void 0 ? void 0 : _b.id) === 'string' && req.query.object.id.length > 0)
                    ? [req.query.object.id]
                    : undefined
                // typeOfGood?: {
                //     typeOfs?: string[];
                //     ids?: string[];
                // };}
            }
        };
        const { data } = yield authorizationService.search(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(searchConditions.limit))
                ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
            results: data.map((authorization) => {
                return Object.assign({}, authorization);
            })
        });
    }
    catch (err) {
        res.json({
            message: err.message,
            success: false,
            count: 0,
            results: []
        });
    }
}));
exports.default = authorizationsRouter;
