/**
 * 予約ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment';
import { format } from 'util';

type IEventReservationPriceSpec = chevre.factory.reservation.IPriceSpecification<chevre.factory.reservationType.EventReservation>;

const reservationsRouter = Router();

reservationsRouter.get(
    '',
    (_, res) => {
        res.render('reservations/index', {
            message: '',
            reservationStatusType: chevre.factory.reservationStatusType
        });
    }
);

reservationsRouter.get(
    '/search',
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
            const { totalCount, data } = await reservationService.search(searchConditions);

            res.json({
                success: true,
                count: totalCount,
                results: data.map((t) => {
                    const priceSpecification = <IEventReservationPriceSpec>t.price;
                    const unitPriceSpec = priceSpecification.priceComponent.find(
                        (c) => c.typeOf === chevre.factory.priceSpecificationType.UnitPriceSpecification
                    );

                    return {
                        ...t,
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
