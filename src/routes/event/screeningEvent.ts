/**
 * 上映イベント管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import { CREATED } from 'http-status';
import * as moment from 'moment';

import * as ScreeningEventController from '../../controllers/event/screeningEvent';

const screeningEventRouter = Router();
screeningEventRouter.get('', ScreeningEventController.index);
screeningEventRouter.get('/search', ScreeningEventController.search);
screeningEventRouter.get('/searchScreeningEventSeries', ScreeningEventController.searchScreeningEventSeries);
screeningEventRouter.post('/regist', ScreeningEventController.regist);
screeningEventRouter.post('/:eventId/update', ScreeningEventController.update);
screeningEventRouter.put('/:eventId/cancel', ScreeningEventController.cancelPerformance);

/**
 * COAイベントインポート
 */
screeningEventRouter.post(
    '/importFromCOA',
    async (req, res, next) => {
        try {
            const taskService = new chevre.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const importFrom = moment().toDate();
            // tslint:disable-next-line:no-magic-numbers
            const importThrough = moment(importFrom).add(2, 'months').toDate();
            const taskAttributes = [{
                name: <chevre.factory.taskName.ImportEventsFromCOA>chevre.factory.taskName.ImportEventsFromCOA,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 1,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    locationBranchCode: req.body.theater,
                    importFrom: importFrom,
                    importThrough: importThrough
                }
            }];

            const tasks = await Promise.all(taskAttributes.map(async (a) => {
                return taskService.create(a);
            }));

            res.status(CREATED)
                .json(tasks);
        } catch (error) {
            next(error);
        }
    }
);

export default screeningEventRouter;
