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
 * 注文ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const cinerino = require("@cinerino/sdk");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const orderStatusType_1 = require("../factory/orderStatusType");
const ordersRouter = express_1.Router();
ordersRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('orders/index', {
        message: '',
        orderStatusTypes: orderStatusType_1.orderStatusTypes
    });
}));
ordersRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    try {
        const orderService = new chevre.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const iamService = new cinerino.service.IAM({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchApplicationsResult = yield iamService.searchMembers({
            member: { typeOf: { $eq: chevre.factory.creativeWorkType.WebApplication } }
        });
        const applications = searchApplicationsResult.data.map((d) => d.member);
        const customerIdentifierIn = [];
        if (typeof req.query.application === 'string' && req.query.application.length > 0) {
            customerIdentifierIn.push({ name: 'clientId', value: req.query.application });
        }
        // let underNameIdEq: string | undefined;
        // if (typeof req.query.underName?.id === 'string' && req.query.underName?.id.length > 0) {
        //     underNameIdEq = req.query.underName?.id;
        // }
        // let brokerIdEq: string | undefined;
        // if (typeof req.query.admin?.id === 'string' && req.query.admin?.id.length > 0) {
        //     brokerIdEq = req.query.admin?.id;
        // }
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            project: { id: { $eq: req.project.id } },
            confirmationNumbers: (typeof req.query.confirmationNumber === 'string' && req.query.confirmationNumber.length > 0)
                ? [req.query.confirmationNumber]
                : undefined,
            orderStatuses: (req.query.orderStatus !== undefined && req.query.orderStatus !== '')
                ? [req.query.orderStatus]
                : undefined,
            orderNumbers: (typeof req.query.orderNumber === 'string' && req.query.orderNumber.length > 0)
                ? [req.query.orderNumber]
                : undefined,
            orderDate: {
                $gte: (typeof req.query.orderFrom === 'string' && req.query.orderFrom.length > 0)
                    ? moment(`${String(req.query.orderFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate()
                    : undefined,
                $lte: (typeof req.query.orderThrough === 'string' && req.query.orderThrough.length > 0)
                    ? moment(`${String(req.query.orderThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .add(1, 'day')
                        .toDate()
                    : undefined
            },
            customer: {
                memberOf: {
                    membershipNumber: {
                        $eq: (typeof ((_a = req.query.customer) === null || _a === void 0 ? void 0 : _a.membershipNumber) === 'string'
                            && req.query.customer.membershipNumber.length > 0)
                            ? req.query.customer.membershipNumber
                            : undefined
                    }
                },
                ids: (typeof ((_b = req.query.customer) === null || _b === void 0 ? void 0 : _b.id) === 'string' && req.query.customer.id.length > 0)
                    ? [req.query.customer.id]
                    : (typeof req.query.customerId === 'string' && req.query.customerId.length > 0)
                        ? [req.query.customerId]
                        : undefined,
                familyName: (typeof ((_c = req.query.customer) === null || _c === void 0 ? void 0 : _c.familyName) === 'string' && req.query.customer.familyName.length > 0)
                    ? { $regex: req.query.customer.familyName }
                    : undefined,
                givenName: (typeof ((_d = req.query.customer) === null || _d === void 0 ? void 0 : _d.givenName) === 'string' && req.query.customer.givenName.length > 0)
                    ? { $regex: req.query.customer.givenName }
                    : undefined,
                email: (typeof ((_e = req.query.customer) === null || _e === void 0 ? void 0 : _e.email) === 'string' && req.query.customer.email.length > 0)
                    ? { $regex: req.query.customer.email }
                    : undefined,
                telephone: (typeof ((_f = req.query.customer) === null || _f === void 0 ? void 0 : _f.telephone) === 'string' && req.query.customer.telephone.length > 0)
                    ? { $regex: req.query.customer.telephone }
                    : undefined,
                identifier: {
                    $in: (customerIdentifierIn.length > 0) ? customerIdentifierIn : undefined
                }
            },
            seller: {
                ids: (typeof req.query.seller === 'string' && req.query.seller.length > 0)
                    ? [req.query.seller]
                    : undefined
            },
            acceptedOffers: {
                itemOffered: {
                    typeOf: {
                        $in: (typeof ((_g = req.query.itemOffered) === null || _g === void 0 ? void 0 : _g.typeOf) === 'string' && req.query.itemOffered.typeOf.length > 0)
                            ? [req.query.itemOffered.typeOf]
                            : undefined
                    },
                    identifier: {
                        $in: (typeof ((_h = req.query.itemOffered) === null || _h === void 0 ? void 0 : _h.identifier) === 'string' && req.query.itemOffered.identifier.length > 0)
                            ? [req.query.itemOffered.identifier]
                            : undefined
                    },
                    issuedThrough: {
                        id: {
                            $in: (typeof ((_k = (_j = req.query.itemOffered) === null || _j === void 0 ? void 0 : _j.issuedThrough) === null || _k === void 0 ? void 0 : _k.id) === 'string'
                                && req.query.itemOffered.issuedThrough.id.length > 0)
                                ? [req.query.itemOffered.issuedThrough.id]
                                : undefined
                        }
                    },
                    ids: (typeof ((_l = req.query.itemOffered) === null || _l === void 0 ? void 0 : _l.id) === 'string' && req.query.itemOffered.id.length > 0)
                        ? [req.query.itemOffered.id]
                        : undefined,
                    reservationNumbers: (typeof req.query.reservationNumber === 'string' && req.query.reservationNumber.length > 0)
                        ? [req.query.reservationNumber]
                        : undefined,
                    reservationFor: {
                        ids: (typeof ((_m = req.query.reservationFor) === null || _m === void 0 ? void 0 : _m.id) === 'string' && req.query.reservationFor.id.length > 0)
                            ? [req.query.reservationFor.id]
                            : undefined,
                        name: (typeof ((_o = req.query.reservationFor) === null || _o === void 0 ? void 0 : _o.name) === 'string' && req.query.reservationFor.name.length > 0)
                            ? req.query.reservationFor.name
                            : undefined,
                        startFrom: (typeof req.query.reservationForStartFrom === 'string'
                            && req.query.reservationForStartFrom.length > 0)
                            ? moment(`${String(req.query.reservationForStartFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                                .toDate()
                            : undefined,
                        startThrough: (typeof req.query.reservationForStartThrough === 'string'
                            && req.query.reservationForStartThrough.length > 0)
                            ? moment(`${String(req.query.reservationForStartThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                                .add(1, 'day')
                                .toDate()
                            : undefined,
                        superEvent: {
                            ids: (typeof ((_q = (_p = req.query.reservationFor) === null || _p === void 0 ? void 0 : _p.superEvent) === null || _q === void 0 ? void 0 : _q.id) === 'string'
                                && req.query.reservationFor.superEvent.id.length > 0)
                                ? [req.query.reservationFor.superEvent.id]
                                : undefined,
                            workPerformed: {
                                identifiers: (typeof ((_s = (_r = req.query.reservationFor) === null || _r === void 0 ? void 0 : _r.workPerformed) === null || _s === void 0 ? void 0 : _s.identifier) === 'string'
                                    && req.query.reservationFor.workPerformed.identifier.length > 0)
                                    ? [req.query.reservationFor.workPerformed.identifier]
                                    : undefined
                            }
                        }
                    }
                }
            },
            paymentMethods: {
                typeOfs: (typeof req.query.paymentMethodType === 'string' && req.query.paymentMethodType.length > 0)
                    ? [req.query.paymentMethodType]
                    : undefined,
                accountIds: (typeof ((_t = req.query.paymentMethod) === null || _t === void 0 ? void 0 : _t.accountId) === 'string' && req.query.paymentMethod.accountId.length > 0)
                    ? [req.query.paymentMethod.accountId]
                    : undefined,
                paymentMethodIds: (typeof req.query.paymentMethodId === 'string' && req.query.paymentMethodId.length > 0)
                    ? [req.query.paymentMethodId]
                    : undefined
            },
            price: {
                $gte: (typeof ((_u = req.query.price) === null || _u === void 0 ? void 0 : _u.$gte) === 'string' && req.query.price.$gte.length > 0)
                    ? Number(req.query.price.$gte)
                    : undefined,
                $lte: (typeof ((_v = req.query.price) === null || _v === void 0 ? void 0 : _v.$lte) === 'string' && req.query.price.$lte.length > 0)
                    ? Number(req.query.price.$lte)
                    : undefined
            }
            // broker: {
            //     id: (typeof brokerIdEq === 'string')
            //         ? brokerIdEq
            //         : undefined
            // }
        };
        const { data } = yield orderService.search(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(searchConditions.limit))
                ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
            results: data.map((order) => {
                var _a, _b, _c;
                let clientId;
                if (Array.isArray((_a = order.customer) === null || _a === void 0 ? void 0 : _a.identifier)) {
                    clientId = (_c = (_b = order.customer) === null || _b === void 0 ? void 0 : _b.identifier.find((i) => i.name === 'clientId')) === null || _c === void 0 ? void 0 : _c.value;
                }
                const application = applications.find((a) => a.id === clientId);
                const numItems = (Array.isArray(order.acceptedOffers)) ? order.acceptedOffers.length : 0;
                const numPaymentMethods = (Array.isArray(order.paymentMethods)) ? order.paymentMethods.length : 0;
                let itemType = [];
                let itemTypeStr = '';
                if (Array.isArray(order.acceptedOffers) && order.acceptedOffers.length > 0) {
                    itemTypeStr = order.acceptedOffers[0].itemOffered.typeOf;
                    itemTypeStr += ` x ${order.acceptedOffers.length}`;
                    itemType = order.acceptedOffers.map((o) => o.itemOffered.typeOf);
                }
                let paymentMethodTypeStr = '';
                if (Array.isArray(order.paymentMethods) && order.paymentMethods.length > 0) {
                    paymentMethodTypeStr = order.paymentMethods.map((p) => p.typeOf)
                        .join(',');
                }
                return Object.assign(Object.assign({}, order), { application: application, numItems,
                    numPaymentMethods,
                    itemType,
                    itemTypeStr,
                    paymentMethodTypeStr });
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
ordersRouter.get('/searchAdmins', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const iamService = new cinerino.service.IAM({
            endpoint: process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const limit = 10;
        const page = 1;
        const nameRegex = req.query.name;
        const { data } = yield iamService.searchMembers({
            limit: limit,
            member: {
                typeOf: { $eq: cinerino.factory.personType.Person },
                name: { $regex: (typeof nameRegex === 'string' && nameRegex.length > 0) ? nameRegex : undefined }
            }
        });
        res.json({
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data
        });
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            message: error.message
        });
    }
}));
exports.default = ordersRouter;
