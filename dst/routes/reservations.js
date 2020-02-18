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
 * 予約ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const moment = require("moment");
const util_1 = require("util");
const reservationsRouter = express_1.Router();
reservationsRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchOfferCategoryTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
    });
    res.render('reservations/index', {
        message: '',
        reservationStatusType: chevre.factory.reservationStatusType,
        ticketTypeCategories: searchOfferCategoryTypesResult.data
    });
}));
reservationsRouter.get('/search', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            sort: { modifiedTime: chevre.factory.sortType.Descending },
            project: { ids: [req.project.id] },
            typeOf: chevre.factory.reservationType.EventReservation,
            reservationNumbers: (req.query.reservationNumber !== undefined
                && req.query.reservationNumber !== '')
                ? [String(req.query.reservationNumber)]
                : undefined,
            reservationStatuses: (req.query.reservationStatus !== undefined && req.query.reservationStatus !== '')
                ? [req.query.reservationStatus]
                : undefined,
            reservationFor: {
                ids: (req.query.reservationFor !== undefined
                    && req.query.reservationFor.id !== undefined
                    && req.query.reservationFor.id !== '')
                    ? [String(req.query.reservationFor.id)]
                    : undefined,
                superEvent: {
                    ids: (req.query.reservationFor !== undefined
                        && req.query.reservationFor.superEvent !== undefined
                        && req.query.reservationFor.superEvent.id !== undefined
                        && req.query.reservationFor.superEvent.id !== '')
                        ? [String(req.query.reservationFor.superEvent.id)]
                        : undefined
                },
                startFrom: (req.query.reservationFor !== undefined
                    && req.query.reservationFor.startFrom !== undefined
                    && req.query.reservationFor.startFrom !== '')
                    ? moment(`${String(req.query.reservationFor.startFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                    : undefined,
                startThrough: (req.query.reservationFor !== undefined
                    && req.query.reservationFor.startThrough !== undefined
                    && req.query.reservationFor.startThrough !== '')
                    ? moment(`${String(req.query.reservationFor.startThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .add(1, 'day')
                        .toDate()
                    : undefined
            },
            modifiedFrom: (req.query.modifiedFrom !== '')
                ? moment(`${String(req.query.modifiedFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            modifiedThrough: (req.query.modifiedThrough !== '')
                ? moment(`${String(req.query.modifiedThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                    .add(1, 'day')
                    .toDate()
                : undefined,
            bookingFrom: (req.query.bookingFrom !== '')
                ? moment(`${String(req.query.bookingFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            bookingThrough: (req.query.bookingThrough !== '')
                ? moment(`${String(req.query.bookingThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                    .add(1, 'day')
                    .toDate()
                : undefined,
            reservedTicket: {
                ticketType: {
                    ids: (req.query.reservedTicket !== undefined
                        && req.query.reservedTicket.ticketType !== undefined
                        && req.query.reservedTicket.ticketType.id !== undefined
                        && req.query.reservedTicket.ticketType.id !== '')
                        ? [req.query.reservedTicket.ticketType.id]
                        : undefined,
                    category: {
                        ids: (req.query.reservedTicket !== undefined
                            && req.query.reservedTicket.ticketType !== undefined
                            && req.query.reservedTicket.ticketType.category !== undefined
                            && req.query.reservedTicket.ticketType.category.id !== undefined
                            && req.query.reservedTicket.ticketType.category.id !== '')
                            ? [req.query.reservedTicket.ticketType.category.id]
                            : undefined
                    }
                },
                ticketedSeat: {
                    seatNumbers: (req.query.reservedTicket !== undefined
                        && req.query.reservedTicket.ticketedSeat !== undefined
                        && req.query.reservedTicket.ticketedSeat.seatNumber !== undefined
                        && req.query.reservedTicket.ticketedSeat.seatNumber !== '')
                        ? [req.query.reservedTicket.ticketedSeat.seatNumber]
                        : undefined
                }
            },
            underName: {
                id: (req.query.underName !== undefined
                    && req.query.underName.id !== undefined
                    && req.query.underName.id !== '')
                    ? req.query.underName.id
                    : undefined,
                name: (req.query.underName !== undefined
                    && req.query.underName.name !== undefined
                    && req.query.underName.name !== '')
                    ? req.query.underName.name
                    : undefined,
                email: (req.query.underName !== undefined
                    && req.query.underName.email !== undefined
                    && req.query.underName.email !== '')
                    ? req.query.underName.email
                    : undefined,
                telephone: (req.query.underName !== undefined
                    && req.query.underName.telephone !== undefined
                    && req.query.underName.telephone !== '')
                    ? req.query.underName.telephone
                    : undefined
            },
            attended: (req.query.attended === '1') ? true : undefined,
            checkedIn: (req.query.checkedIn === '1') ? true : undefined
        };
        const { data } = yield reservationService.search(searchConditions);
        // const offerService = new chevre.service.Offer({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const searchCategoriesResult = await offerService.searchCategories({ project: { ids: [req.project.id] } });
        res.json({
            success: true,
            count: (data.length === Number(searchConditions.limit))
                ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
            results: data.map((t) => {
                const priceSpecification = t.price;
                const unitPriceSpec = priceSpecification.priceComponent.find((c) => c.typeOf === chevre.factory.priceSpecificationType.UnitPriceSpecification);
                // const ticketTYpe = searchOfferCategoryTypesResult.data.find(
                //     (c) => t.reservedTicket !== undefined
                //         && t.reservedTicket !== null
                //         && t.reservedTicket.ticketType.category !== undefined
                //         && c.codeValue === t.reservedTicket.ticketType.category.id
                // );
                return Object.assign(Object.assign({}, t), { 
                    // ticketType: ticketTYpe,
                    unitPriceSpec: unitPriceSpec, ticketedSeat: (t.reservedTicket !== undefined
                        && t.reservedTicket !== null
                        && t.reservedTicket.ticketedSeat !== undefined)
                        ? util_1.format('%s %s', (t.reservedTicket.ticketedSeat.seatingType !== undefined
                            && t.reservedTicket.ticketedSeat.seatingType !== null)
                            ? (typeof t.reservedTicket.ticketedSeat.seatingType === 'string')
                                ? t.reservedTicket.ticketedSeat.seatingType
                                : (Array.isArray(t.reservedTicket.ticketedSeat.seatingType))
                                    ? t.reservedTicket.ticketedSeat.seatingType.join(',')
                                    : t.reservedTicket.ticketedSeat.seatingType.typeOf // 旧データへの互換性対応
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
