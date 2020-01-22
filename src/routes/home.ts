/**
 * プロジェクトホームルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status';
import * as moment from 'moment-timezone';

const homeRouter = Router();

homeRouter.get(
    '/',
    async (req, res, next) => {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));

            return;
        }

        res.render(
            'home',
            {}
        );
    }
);

// homeRouter.get(
//     '/reservationCount',
//     async (req, res) => {
//         try {
//             const reservationService = new chevre.service.Reservation({
//                 endpoint: <string>process.env.API_ENDPOINT,
//                 auth: req.user.authClient
//             });
//             const searchConditions = {
//                 limit: 1,
//                 project: { ids: [req.project.id] },
//                 typeOf: chevre.factory.reservationType.EventReservation,
//                 reservationStatuses: [chevre.factory.reservationStatusType.ReservationConfirmed],
//                 bookingFrom: moment().tz('Asia/Tokyo').startOf('day').toDate(),
//                 bookingThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
//             };
//             const result = await reservationService.search(searchConditions);

//             res.json(result);
//         } catch (error) {
//             res.status(INTERNAL_SERVER_ERROR).json({
//                 error: { message: error.message }
//             });
//         }
//     }
// );

homeRouter.get(
    '/dbStats',
    async (req, res) => {
        try {
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
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR).json({
                error: { message: error.message }
            });
        }
    }
);

homeRouter.get(
    '/health',
    async (req, res) => {
        try {
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
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR).json({
                error: { message: error.message }
            });
        }
    }
);

homeRouter.get(
    '/queueCount',
    async (req, res) => {
        try {
            const taskService = new chevre.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const result = await taskService.search({
                limit: 1,
                project: { ids: [req.project.id] },
                runsFrom: moment().add(-1, 'day').toDate(),
                runsThrough: moment().toDate(),
                statuses: [chevre.factory.taskStatus.Ready]
            });

            res.json(result);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR).json({
                error: { message: error.message }
            });
        }
    }
);

homeRouter.get(
    '/latestReservations',
    async (req, res) => {
        try {
            const reservationService = new chevre.service.Reservation({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const result = await reservationService.search({
                limit: 10,
                page: 1,
                sort: { modifiedTime: chevre.factory.sortType.Descending },
                project: { ids: [req.project.id] },
                typeOf: chevre.factory.reservationType.EventReservation,
                reservationStatuses: [
                    chevre.factory.reservationStatusType.ReservationConfirmed,
                    chevre.factory.reservationStatusType.ReservationPending
                ],
                modifiedFrom: moment().add(-1, 'day').toDate()
            });

            res.json(result);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR).json({
                error: { message: error.message }
            });
        }
    }
);

homeRouter.get(
    '/eventsWithAggregations',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const result = await eventService.searchWithAggregateReservation({
                typeOf: chevre.factory.eventType.ScreeningEvent,
                limit: 10,
                page: 1,
                sort: { startDate: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                inSessionFrom: moment().add().toDate(),
                inSessionThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
            });

            res.json(result);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR).json({
                error: { message: error.message }
            });
        }
    }
);

export default homeRouter;
