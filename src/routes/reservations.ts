/**
 * 予約ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment';
import { format } from 'util';

const reservationsRouter = Router();

reservationsRouter.get('', (_, res) => {
    res.render('reservations/index', {
        message: ''
    });
});
reservationsRouter.get('/search', async (req, res) => {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            sort: { modifiedTime: chevre.factory.sortType.Descending },
            modifiedFrom: (req.query.modifiedFrom !== '')
                ? moment(`${req.query.modifiedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            modifiedThrough: (req.query.modifiedThrough !== '')
                ? moment(`${req.query.modifiedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
                : undefined
            // name: req.query.name
        };
        const { totalCount, data } = await reservationService.searchScreeningEventReservations(searchConditions);

        res.json({
            success: true,
            count: totalCount,
            results: data.map((t) => {
                const priceSpecification = <chevre.factory.reservation.event.IPriceSpecification>t.price;
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
});

export default reservationsRouter;
