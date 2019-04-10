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
        const result = await eventService.countTicketTypePerEvent({
            limit: 10,
            page: 1,
            startFrom: moment().toDate(),
            startThrough: moment().tz('Asia/Tokyo').endOf('day').toDate()
        });

        res.json(result);
    }
);

export default dashboardRouter;
