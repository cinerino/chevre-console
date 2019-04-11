/**
 * ダッシュボードルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment-timezone';

const dashboardRouter = Router();

dashboardRouter.get(
    '/',
    async (req, res, next) => {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));

            return;
        }

        res.render(
            'index',
            {}
        );
    }
);

dashboardRouter.get(
    '/dashboard/reservationCount',
    async (req, res) => {
        const reservationService = new chevre.service.Reservation({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            limit: 1,
            typeOf: chevre.factory.reservationType.EventReservation,
            reservationStatuses: [chevre.factory.reservationStatusType.ReservationConfirmed],
            modifiedFrom: moment().tz('Asia/Tokyo').startOf('day').toDate(),
            modifiedThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
        };
        const result = await reservationService.search(searchConditions);

        res.json(result);
    }
);

dashboardRouter.get(
    '/dashboard/dbStats',
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const stats = await eventService.fetch({
            uri: '/stats/dbStats',
            method: 'GET',
            // tslint:disable-next-line:no-magic-numbers
            expectedStatusCodes: [200]
        }).then(async (response) => {
            return response.json();
        });

        res.json(stats);
    }
);

dashboardRouter.get(
    '/dashboard/health',
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const stats = await eventService.fetch({
            uri: '/health',
            method: 'GET',
            // tslint:disable-next-line:no-magic-numbers
            expectedStatusCodes: [200]
        }).then(async (response) => {
            const version = response.headers.get('X-API-Version');

            return {
                version: version,
                status: await response.text()
            };
        });

        res.json(stats);
    }
);

dashboardRouter.get(
    '/dashboard/latestReservations',
    async (req, res) => {
        const reservationService = new chevre.service.Reservation({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = await reservationService.search({
            typeOf: chevre.factory.reservationType.EventReservation,
            limit: 10,
            page: 1,
            sort: { modifiedTime: chevre.factory.sortType.Descending },
            reservationStatuses: [
                chevre.factory.reservationStatusType.ReservationConfirmed,
                chevre.factory.reservationStatusType.ReservationPending
            ],
            modifiedFrom: moment().add(-1, 'day').toDate()
        });

        res.json(result);
    }
);

dashboardRouter.get(
    '/dashboard/eventsWithAggregations',
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = await eventService.searchWithAggregateReservation({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            limit: 10,
            page: 1,
            sort: { startDate: chevre.factory.sortType.Ascending },
            inSessionFrom: moment().add().toDate(),
            inSessionThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
        });

        res.json(result);
    }
);

export default dashboardRouter;
