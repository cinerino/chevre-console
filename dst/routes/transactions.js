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
const csvtojson = require("csvtojson");
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
transactionsRouter.all('/reserve/start', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let values = {};
        let message = '';
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const reserveService = new chevre.service.transaction.Reserve({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const transactionNumberService = new chevre.service.TransactionNumber({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const event = yield eventService.findById({ id: req.query.event });
        const searchSeatSectionsResult = yield placeService.searchScreeningRoomSections({
            limit: 100,
            page: 1,
            project: { id: { $eq: req.project.id } },
            containedInPlace: {
                branchCode: {
                    $eq: event.location.branchCode
                },
                containedInPlace: {
                    branchCode: {
                        $eq: event.superEvent.location.branchCode
                    }
                }
            }
        });
        const offers = yield eventService.searchTicketOffers({ id: event.id });
        const selectedOffer = offers[0];
        if (selectedOffer === undefined) {
            throw new Error('selectedOffer undefined');
        }
        const useSeats = ((_c = (_b = (_a = event.offers) === null || _a === void 0 ? void 0 : _a.itemOffered.serviceOutput) === null || _b === void 0 ? void 0 : _b.reservedTicket) === null || _c === void 0 ? void 0 : _c.ticketedSeat) !== undefined;
        if (req.method === 'POST') {
            values = req.body;
            try {
                let seatNumbers = (typeof req.body.seatNumbers === 'string') ? [req.body.seatNumbers] : req.body.seatNumbers;
                const numSeats = req.body.numSeats;
                const additionalTicketText = (typeof req.body.additionalTicketText === 'string' && req.body.additionalTicketText.length > 0)
                    ? req.body.additionalTicketText
                    : undefined;
                const seatSection = req.body.seatSection;
                const seatNumbersCsv = req.body.seatNumbersCsv;
                const seatBranchCodeRegex = /^[0-9a-zA-Z\-]+$/;
                if (typeof seatNumbersCsv === 'string' && seatNumbersCsv.length > 0) {
                    seatNumbers = [];
                    // tslint:disable-next-line:await-promise
                    const seatNumbersFromCsv = yield csvtojson()
                        .fromString(seatNumbersCsv);
                    if (Array.isArray(seatNumbersFromCsv)) {
                        seatNumbers = seatNumbersFromCsv.filter((p) => {
                            return typeof p.branchCode === 'string'
                                && p.branchCode.length > 0
                                && seatBranchCodeRegex.test(p.branchCode);
                        })
                            .map((p) => p.branchCode);
                    }
                }
                let acceptedOffer;
                if (useSeats) {
                    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
                        throw new Error('座席番号が指定されていません');
                    }
                    // tslint:disable-next-line:prefer-array-literal
                    acceptedOffer = seatNumbers.map((seatNumber) => {
                        return {
                            id: selectedOffer.id,
                            itemOffered: {
                                serviceOutput: {
                                    typeOf: chevre.factory.reservationType.EventReservation,
                                    additionalTicketText: additionalTicketText,
                                    reservedTicket: {
                                        typeOf: 'Ticket',
                                        ticketedSeat: {
                                            typeOf: chevre.factory.placeType.Seat,
                                            seatNumber: seatNumber,
                                            seatRow: '',
                                            seatSection: seatSection
                                        }
                                    }
                                }
                            }
                        };
                    });
                }
                else {
                    if (typeof numSeats !== 'string' || numSeats.length === 0) {
                        throw new Error('座席数が指定されていません');
                    }
                    // tslint:disable-next-line:prefer-array-literal
                    acceptedOffer = [...Array(Number(numSeats))].map(() => {
                        return {
                            id: selectedOffer.id,
                            itemOffered: {
                                serviceOutput: {
                                    typeOf: chevre.factory.reservationType.EventReservation,
                                    additionalTicketText: additionalTicketText,
                                    reservedTicket: {
                                        typeOf: 'Ticket'
                                    }
                                }
                            }
                        };
                    });
                }
                const expires = moment()
                    .add(1, 'minutes')
                    .toDate();
                const object = {
                    acceptedOffer: acceptedOffer,
                    event: {
                        id: event.id
                    }
                    // onReservationStatusChanged?: IOnReservationStatusChanged;
                };
                debug('取引を開始します...', values, acceptedOffer);
                const { transactionNumber } = yield transactionNumberService.publish({
                    project: { id: req.project.id }
                });
                yield reserveService.startWithNoResponse({
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: chevre.factory.transactionType.Reserve,
                    transactionNumber: transactionNumber,
                    expires: expires,
                    agent: {
                        typeOf: 'Person',
                        id: req.user.profile.sub,
                        name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                    },
                    object: object
                });
                debug('取引が開始されました', transactionNumber);
                // 確認画面へ情報を引き継ぐために
                const transaction = {
                    transactionNumber: transactionNumber,
                    object: object
                };
                // セッションに取引追加
                req.session[`transaction:${transaction.transactionNumber}`] = transaction;
                res.redirect(`/transactions/reserve/${transaction.transactionNumber}/confirm`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
        res.render('transactions/reserve/start', {
            values: values,
            message: message,
            moment: moment,
            event: event,
            seatSections: searchSeatSectionsResult.data,
            useSeats
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 予約取引確認
 */
transactionsRouter.all('/reserve/:transactionNumber/confirm', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        let message = '';
        const transaction = req.session[`transaction:${req.params.transactionNumber}`];
        if (transaction === undefined) {
            throw new chevre.factory.errors.NotFound('Transaction in session');
        }
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const reserveService = new chevre.service.transaction.Reserve({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const eventId = (_d = transaction.object.event) === null || _d === void 0 ? void 0 : _d.id;
        if (typeof eventId !== 'string') {
            throw new chevre.factory.errors.NotFound('Event not specified');
        }
        if (req.method === 'POST') {
            // 確定
            yield reserveService.confirm({ transactionNumber: transaction.transactionNumber });
            message = '予約取引を確定しました';
            // セッション削除
            // tslint:disable-next-line:no-dynamic-delete
            delete req.session[`transaction:${transaction.transactionNumber}`];
            req.flash('message', message);
            res.redirect(`/transactions/reserve/start?event=${eventId}`);
            return;
        }
        else {
            const event = yield eventService.findById({ id: eventId });
            res.render('transactions/reserve/confirm', {
                transaction: transaction,
                moment: moment,
                message: message,
                event: event
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引中止
 */
transactionsRouter.all('/reserve/:transactionNumber/cancel', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        let message = '';
        const transaction = req.session[`transaction:${req.params.transactionNumber}`];
        if (transaction === undefined) {
            throw new chevre.factory.errors.NotFound('Transaction in session');
        }
        const reserveService = new chevre.service.transaction.Reserve({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const eventId = (_e = transaction.object.event) === null || _e === void 0 ? void 0 : _e.id;
        if (typeof eventId !== 'string') {
            throw new chevre.factory.errors.NotFound('Event not specified');
        }
        if (req.method === 'POST') {
            // 確定
            yield reserveService.cancel({ transactionNumber: transaction.transactionNumber });
            message = '予約取引を中止しました';
            // セッション削除
            // tslint:disable-next-line:no-dynamic-delete
            delete req.session[`transaction:${transaction.transactionNumber}`];
            req.flash('message', message);
            res.redirect(`/transactions/reserve/start?event=${eventId}`);
            return;
        }
        throw new Error('not implemented');
    }
    catch (error) {
        next(error);
    }
}));
exports.default = transactionsRouter;
