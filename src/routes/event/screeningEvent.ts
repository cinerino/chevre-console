/**
 * 上映イベント管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import { CREATED, INTERNAL_SERVER_ERROR } from 'http-status';
import * as moment from 'moment';

import * as ScreeningEventController from '../../controllers/event/screeningEvent';

const screeningEventRouter = Router();
screeningEventRouter.get('', ScreeningEventController.index);

screeningEventRouter.get(
    '/getlist',
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        try {
            const date = req.query.date;

            const movieTheater = await placeService.findMovieTheaterById({ id: req.query.theater });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await eventService.search({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                typeOf: chevre.factory.eventType.ScreeningEvent,
                eventStatuses: [chevre.factory.eventStatusType.EventScheduled],
                inSessionFrom: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                    .toDate(),
                inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                    .add(1, 'day')
                    .toDate(),
                // location: {
                //     branchCodes: (typeof req.query.screen === 'string' && req.query.screen.length > 0)
                //         ? [req.query.screen]
                //         : undefined
                // },
                superEvent: {
                    locationBranchCodes: [movieTheater.branchCode]
                },
                offers: {
                    itemOffered: {
                        serviceOutput: {
                            reservedTicket: {
                                ticketedSeat: {
                                    // 座席指定有のみの検索の場合
                                    typeOfs: req.query.onlyReservedSeatsAvailable === '1'
                                        ? [chevre.factory.placeType.Seat]
                                        : undefined
                                }
                            }
                        }
                    }
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

screeningEventRouter.get('/search', ScreeningEventController.search);
screeningEventRouter.get('/searchScreeningEventSeries', ScreeningEventController.searchScreeningEventSeries);
screeningEventRouter.post('/regist', ScreeningEventController.regist);
screeningEventRouter.post('/:eventId/update', ScreeningEventController.update);
screeningEventRouter.put('/:eventId/cancel', ScreeningEventController.cancelPerformance);

screeningEventRouter.get(
    '/:id/offers',
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        try {
            const offers = await eventService.searchTicketOffers({ id: req.params.id });

            res.json(offers);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR)
                .json({
                    message: error.message
                });
        }
    }
);

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

            const importFrom = moment()
                .toDate();
            const importThrough = moment(importFrom)
                // tslint:disable-next-line:no-magic-numbers
                .add(2, 'months')
                .toDate();
            const taskAttributes = [{
                project: req.project,
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
