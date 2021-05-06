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
const express_1 = require("express");
const actionsRouter = express_1.Router();
actionsRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('actions/index', {
        message: '',
        ActionType: chevre.factory.actionType,
        ActionStatusType: chevre.factory.actionStatusType
    });
}));
actionsRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    try {
        const actionService = new chevre.service.Action({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const paymentMethodAccountIdEq = (_c = (_b = (_a = req.query.object) === null || _a === void 0 ? void 0 : _a.paymentMethod) === null || _b === void 0 ? void 0 : _b.accountId) === null || _c === void 0 ? void 0 : _c.$eq;
        const paymentMethodIdEq = (_f = (_e = (_d = req.query.object) === null || _d === void 0 ? void 0 : _d.paymentMethod) === null || _e === void 0 ? void 0 : _e.paymentMethodId) === null || _f === void 0 ? void 0 : _f.$eq;
        const paymentMethodTypeEq = (_j = (_h = (_g = req.query.object) === null || _g === void 0 ? void 0 : _g.paymentMethod) === null || _h === void 0 ? void 0 : _h.typeOf) === null || _j === void 0 ? void 0 : _j.$eq;
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            project: { id: { $eq: req.project.id } },
            agent: {
                id: {
                    $in: (typeof ((_l = (_k = req.query.agent) === null || _k === void 0 ? void 0 : _k.id) === null || _l === void 0 ? void 0 : _l.$eq) === 'string' && req.query.agent.id.$eq.length > 0)
                        ? [req.query.agent.id.$eq]
                        : undefined
                },
                typeOf: {
                    $in: (typeof ((_o = (_m = req.query.agent) === null || _m === void 0 ? void 0 : _m.typeOf) === null || _o === void 0 ? void 0 : _o.$eq) === 'string' && req.query.agent.typeOf.$eq.length > 0)
                        ? [req.query.agent.typeOf.$eq]
                        : undefined
                }
            },
            typeOf: {
                $eq: (typeof ((_p = req.query.typeOf) === null || _p === void 0 ? void 0 : _p.$eq) === 'string' && req.query.typeOf.$eq.length > 0)
                    ? req.query.typeOf.$eq
                    : undefined
            },
            actionStatus: {
                $in: (typeof ((_q = req.query.actionStatus) === null || _q === void 0 ? void 0 : _q.$eq) === 'string' && req.query.actionStatus.$eq.length > 0)
                    ? [req.query.actionStatus.$eq]
                    : undefined
            },
            location: {
                identifier: {
                    $eq: (typeof ((_s = (_r = req.query.location) === null || _r === void 0 ? void 0 : _r.identifier) === null || _s === void 0 ? void 0 : _s.$eq) === 'string' && req.query.location.identifier.$eq.length > 0)
                        ? req.query.location.identifier.$eq
                        : undefined
                }
            },
            object: {
                reservationFor: {
                    id: {
                        $eq: (typeof ((_v = (_u = (_t = req.query.object) === null || _t === void 0 ? void 0 : _t.reservationFor) === null || _u === void 0 ? void 0 : _u.id) === null || _v === void 0 ? void 0 : _v.$eq) === 'string'
                            && req.query.object.reservationFor.id.$eq.length > 0)
                            ? req.query.object.reservationFor.id.$eq
                            : undefined
                    }
                },
                paymentMethod: {
                    accountId: {
                        $eq: (typeof paymentMethodAccountIdEq === 'string' && paymentMethodAccountIdEq.length > 0)
                            ? paymentMethodAccountIdEq
                            : undefined
                    },
                    paymentMethodId: {
                        $eq: (typeof paymentMethodIdEq === 'string' && paymentMethodIdEq.length > 0)
                            ? paymentMethodIdEq
                            : undefined
                    },
                    typeOf: {
                        $eq: (typeof paymentMethodTypeEq === 'string' && paymentMethodTypeEq.length > 0)
                            ? paymentMethodTypeEq
                            : undefined
                    }
                }
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
                const resultType = (a.result !== undefined && a.result !== null) ? '表示' : '';
                const errorType = (a.error !== undefined && a.error !== null) ? '表示' : '';
                const purposeType = (a.purpose !== undefined && a.purpose !== null)
                    ? String(a.purpose.typeOf)
                    : '';
                const instrumentType = (a.instrument !== undefined && a.instrument !== null)
                    ? String(a.instrument.typeOf)
                    : '';
                return Object.assign(Object.assign({}, a), { objectType,
                    resultType,
                    errorType,
                    purposeType,
                    instrumentType });
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
