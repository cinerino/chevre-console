/**
 * 上映イベントシリーズマスタ管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
// import * as createDebug from 'debug';
import { Router } from 'express';
// import { INTERNAL_SERVER_ERROR } from 'http-status';
import * as _ from 'underscore';

// import * as Message from '../../message';

import * as ScreeningEventSeriesController from '../../controllers/event/screeningEventSeries';

const screeningEventSeriesRouter = Router();

screeningEventSeriesRouter.all('/add', ScreeningEventSeriesController.add);
screeningEventSeriesRouter.all('', ScreeningEventSeriesController.index);

screeningEventSeriesRouter.get(
    '/getlist',
    async (req, res): Promise<void> => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await eventService.search<chevre.factory.eventType.ScreeningEventSeries>({
                limit: limit,
                page: page,
                sort: { startDate: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                name: req.query.name,
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                endFrom: (req.query.containsEnded === '1') ? undefined : new Date(),
                location: {
                    branchCodes: (req.query.locationBranchCode !== '') ? [req.query.locationBranchCode] : undefined
                },
                workPerformed: {
                    identifiers: (req.query.movieIdentifier !== '') ? [req.query.movieIdentifier] : undefined
                }
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data
            });
        } catch (error) {
            res.json({
                success: false,
                count: 0,
                results: error
            });
        }
    }
);

screeningEventSeriesRouter.all('/getrating', ScreeningEventSeriesController.getRating);
screeningEventSeriesRouter.get('/search', ScreeningEventSeriesController.search);
screeningEventSeriesRouter.all('/:eventId/update', ScreeningEventSeriesController.update);
screeningEventSeriesRouter.get('/:eventId/screeningEvents', ScreeningEventSeriesController.searchScreeningEvents);

export default screeningEventSeriesRouter;
