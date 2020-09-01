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
 * アクションルーター
 */
const chevre = require("@chevre/api-nodejs-client");
// import * as cinerino from '@cinerino/sdk';
const express_1 = require("express");
// import { INTERNAL_SERVER_ERROR, NO_CONTENT } from 'http-status';
// import * as moment from 'moment';
const actionsRouter = express_1.Router();
actionsRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('actions/index', {
        message: '',
        ActionType: chevre.factory.actionType
        // reservationStatusType: chevre.factory.reservationStatusType,
        // reservationStatusTypes: reservationStatusTypes,
        // ticketTypeCategories: searchOfferCategoryTypesResult.data,
        // movieTheaters: searchMovieTheatersResult.data
    });
}));
actionsRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const actionService = new chevre.service.Action({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            project: { id: { $eq: req.project.id } },
            typeOf: {
                $eq: (typeof ((_a = req.query.typeOf) === null || _a === void 0 ? void 0 : _a.$eq) === 'string' && req.query.typeOf.$eq.length > 0)
                    ? req.query.typeOf.$eq
                    : undefined
            }
        };
        const { data } = yield actionService.search(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(searchConditions.limit))
                ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
            results: data.map((a) => {
                var _a;
                const objectType = (Array.isArray(a.object)) ? (_a = a.object[0]) === null || _a === void 0 ? void 0 : _a.typeOf : a.object.typeOf;
                return Object.assign(Object.assign({}, a), { objectType
                    // application: application,
                    // reservationStatusTypeName: reservationStatusType?.name,
                    // checkedInText: (t.checkedIn === true) ? 'done' : undefined,
                    // attendedText: (t.attended === true) ? 'done' : undefined,
                    // unitPriceSpec: unitPriceSpec,
                    // ticketedSeat: ticketedSeatStr
                 });
            })
        });
    }
    catch (err) {
        console.error(err);
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
exports.default = actionsRouter;
