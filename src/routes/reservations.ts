/**
 * 予約ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment';
import { format } from 'util';

type IEventReservationPriceSpec = chevre.factory.reservation.IPriceSpecification<chevre.factory.reservationType.EventReservation>;

const ticketTypeCategories = [
    { id: chevre.factory.ticketTypeCategory.Default, name: '有料券' },
    { id: chevre.factory.ticketTypeCategory.Advance, name: '前売券' },
    { id: chevre.factory.ticketTypeCategory.Free, name: '無料券' }
];

const reservationsRouter = Router();

reservationsRouter.get(
    '',
    (_, res) => {
        res.render('reservations/index', {
            message: '',
            reservationStatusType: chevre.factory.reservationStatusType,
            ticketTypeCategories: ticketTypeCategories
        });
    }
);

reservationsRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const reservationService = new chevre.service.Reservation({
                endpoint: <string>process.env.API_ENDPOINT,
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
                    }
                },
                modifiedFrom: (req.query.modifiedFrom !== '')
                    ? moment(`${String(req.query.modifiedFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                    : undefined,
                modifiedThrough: (req.query.modifiedThrough !== '')
                    ? moment(`${String(req.query.modifiedThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
                    : undefined,
                bookingFrom: (req.query.bookingFrom !== '')
                    ? moment(`${String(req.query.bookingFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                    : undefined,
                bookingThrough: (req.query.bookingThrough !== '')
                    ? moment(`${String(req.query.bookingThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
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
            const { totalCount, data } = await reservationService.search(searchConditions);

            res.json({
                success: true,
                count: totalCount,
                results: data.map((t) => {
                    const priceSpecification = <IEventReservationPriceSpec>t.price;
                    const unitPriceSpec = priceSpecification.priceComponent.find(
                        (c) => c.typeOf === chevre.factory.priceSpecificationType.UnitPriceSpecification
                    );

                    const ticketTYpe = ticketTypeCategories.find(
                        (c) => t.reservedTicket.ticketType.category !== undefined && c.id === t.reservedTicket.ticketType.category.id
                    );

                    return {
                        ...t,
                        ticketType: ticketTYpe,
                        unitPriceSpec: unitPriceSpec,
                        ticketedSeat: (t.reservedTicket.ticketedSeat !== undefined)
                            ? format(
                                '%s %s',
                                (t.reservedTicket.ticketedSeat.seatingType !== undefined)
                                    ? t.reservedTicket.ticketedSeat.seatingType.typeOf
                                    : '',
                                t.reservedTicket.ticketedSeat.seatNumber
                            )
                            : '非指定'
                    };
                })
            });
        } catch (err) {
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

export default reservationsRouter;
