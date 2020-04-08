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
 * 取引ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
const debug = createDebug('chevre-console:router');
const transactionsRouter = express.Router();
/**
 * 取引検索
 */
transactionsRouter.get('/', (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        debug('searching transactions...', req.query);
        throw new Error('Not implemented');
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 予約取引開始
 */
transactionsRouter.all('/reserve/start', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let values = {};
        let message = '';
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const event = yield eventService.findById({ id: req.query.event });
        const offers = yield eventService.searchTicketOffers({ id: event.id });
        const selectedOffer = offers[0];
        if (selectedOffer === undefined) {
            throw new Error('selectedOffer undefined');
        }
        if (req.method === 'POST') {
            values = req.body;
            try {
                const reserveService = new chevre.service.transaction.Reserve({
                    endpoint: process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                const expires = moment()
                    .add(1, 'minutes')
                    .toDate();
                debug('取引を開始します...', values);
                let transaction = yield reserveService.start({
                    project: req.project,
                    typeOf: chevre.factory.transactionType.Reserve,
                    expires: expires,
                    agent: {
                        typeOf: 'Person',
                        id: req.user.profile.sub,
                        name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                    },
                    object: {}
                });
                debug('取引が開始されました。', transaction.id);
                const numSeats = Number(req.body.numSeats);
                transaction = yield reserveService.addReservations({
                    id: transaction.id,
                    object: {
                        // tslint:disable-next-line:prefer-array-literal
                        acceptedOffer: [...Array(numSeats)].map(() => {
                            return {
                                id: selectedOffer.id,
                                itemOffered: {
                                    serviceOutput: {
                                        typeOf: chevre.factory.reservationType.EventReservation,
                                        // additionalProperty?: IPropertyValue < string > [];
                                        additionalTicketText: req.body.additionalTicketText,
                                        reservedTicket: {
                                            typeOf: 'Ticket',
                                        }
                                    }
                                }
                            };
                        }),
                        event: {
                            id: event.id
                        }
                        // onReservationStatusChanged?: IOnReservationStatusChanged;
                    }
                });
                // セッションに取引追加
                req.session[`transaction:${transaction.id}`] = transaction;
                res.redirect(`/transactions/reserve/${transaction.id}/confirm`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
        res.render('transactions/reserve/start', {
            values: values,
            message: message,
            event: event
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 予約取引確認
 */
transactionsRouter.all('/reserve/:transactionId/confirm', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let message = '';
        const transaction = req.session[`transaction:${req.params.transactionId}`];
        if (transaction === undefined) {
            throw new chevre.factory.errors.NotFound('Transaction in session');
        }
        const eventId = (_a = transaction.object.reservationFor) === null || _a === void 0 ? void 0 : _a.id;
        if (typeof eventId !== 'string') {
            throw new chevre.factory.errors.NotFound('Event not specified');
        }
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const event = yield eventService.findById({ id: eventId });
        if (req.method === 'POST') {
            // 確定
            const reserveService = new chevre.service.transaction.Reserve({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            yield reserveService.confirm({ id: transaction.id });
            debug('取引確定です。');
            message = '予約取引を実行しました。';
            // セッション削除
            // tslint:disable-next-line:no-dynamic-delete
            delete req.session[`transaction:${transaction.id}`];
            req.flash('message', message);
            res.redirect(`/transactions/reserve/start?event=${event.id}`);
            return;
        }
        else {
            // 入金先口座情報を検索
            // const accountService = new pecorinoapi.service.Account({
            //     endpoint: <string>process.env.API_ENDPOINT,
            //     auth: req.user.authClient
            // });
            // const searchAccountsResult = await accountService.search({
            //     accountType: transaction.object.toLocation.accountType,
            //     accountNumbers: [transaction.object.toLocation.accountNumber],
            //     statuses: [],
            //     limit: 1
            // });
            // toAccount = searchAccountsResult.data.shift();
            // if (toAccount === undefined) {
            //     throw new Error('To Location Not Found');
            // }
        }
        res.render('transactions/reserve/confirm', {
            transaction: transaction,
            message: message,
            event: event
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = transactionsRouter;
