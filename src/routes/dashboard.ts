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
