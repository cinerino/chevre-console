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
 * 予約ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const moment = require("moment");
const util_1 = require("util");
const reservationsRouter = express_1.Router();
reservationsRouter.get('', (_, res) => {
    res.render('reservations/index', {
        message: '',
        reservationStatusType: chevre.factory.reservationStatusType
    });
});
reservationsRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            sort: { modifiedTime: chevre.factory.sortType.Descending },
            typeOf: chevre.factory.reservationType.EventReservation,
            reservationNumbers: (req.query.reservationNumber !== undefined
                && req.query.reservationNumber !== '')
                ? [String(req.query.reservationNumber)]
                : undefined,
            reservationStatuses: (req.query.reservationStatus !== undefined && req.query.reservationStatus !== '')
                ? [req.query.reservationStatus]
                : undefined,
            reservationFor: {
                // typeOf: EventType;
                // id: string;
                ids: (req.query.reservationFor !== undefined
                    && req.query.reservationFor.id !== undefined
                    && req.query.reservationFor.id !== '')
                    ? [String(req.query.reservationFor.id)]
                    : undefined
                // superEvent: {
                //     id?: string;
                //     ids?: string[];
                // }
                // startFrom?: Date;
                // startThrough?: Date;
            },
            modifiedFrom: (req.query.modifiedFrom !== '')
                ? moment(`${String(req.query.modifiedFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            modifiedThrough: (req.query.modifiedThrough !== '')
                ? moment(`${String(req.query.modifiedThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
                : undefined
            // name: req.query.name
        };
        const { totalCount, data } = yield reservationService.search(searchConditions);
        res.json({
            success: true,
            count: totalCount,
            results: data.map((t) => {
                const priceSpecification = t.price;
                const unitPriceSpec = priceSpecification.priceComponent.find((c) => c.typeOf === chevre.factory.priceSpecificationType.UnitPriceSpecification);
                return Object.assign({}, t, { unitPriceSpec: unitPriceSpec, ticketedSeat: (t.reservedTicket.ticketedSeat !== undefined)
                        ? util_1.format('%s %s', (t.reservedTicket.ticketedSeat.seatingType !== undefined)
                            ? t.reservedTicket.ticketedSeat.seatingType.typeOf
                            : '', t.reservedTicket.ticketedSeat.seatNumber)
                        : '非指定' });
            })
        });
    }
    catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
exports.default = reservationsRouter;
