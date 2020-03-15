/**
 * 上映イベント管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Router } from 'express';
import { CREATED, INTERNAL_SERVER_ERROR } from 'http-status';
import * as moment from 'moment';

import { ProductType } from '../../factory/productType';

const debug = createDebug('chevre-backend:routes');

import * as ScreeningEventController from '../../controllers/event/screeningEvent';

const screeningEventRouter = Router();
screeningEventRouter.get('', ScreeningEventController.index);

screeningEventRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        try {
            debug('searching...query:', req.query);
            const now = new Date();
            const format = req.query.format;
            const date = req.query.date;
            const days = Number(format);
            const locationId = req.query.theater;
            const screeningRoomBranchCode = req.query.screen;
            const superEventWorkPerformedIdentifierEq = req.query.superEvent?.workPerformed?.identifier;

            const searchConditions: chevre.factory.event.ISearchConditions<chevre.factory.eventType.ScreeningEvent>
                = {
                project: { ids: [req.project.id] },
                typeOf: chevre.factory.eventType.ScreeningEvent,
                eventStatuses: [chevre.factory.eventStatusType.EventScheduled],
                inSessionFrom: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                    .toDate(),
                inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                    .add(days, 'day')
                    .toDate(),
                // inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                //     .add(1, 'day')
                //     .toDate(),
                superEvent: {
                    location: { id: { $eq: locationId } },
                    workPerformedIdentifiers: (typeof superEventWorkPerformedIdentifierEq === 'string'
                        && superEventWorkPerformedIdentifierEq.length > 0)
                        ? [superEventWorkPerformedIdentifierEq]
                        : undefined
                },
                offers: {
                    availableFrom: (req.query.offersAvailable === '1') ? now : undefined,
                    availableThrough: (req.query.offersAvailable === '1') ? now : undefined,
                    validFrom: (req.query.offersValid === '1') ? now : undefined,
                    validThrough: (req.query.offersValid === '1') ? now : undefined,
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
                },
                ...{
                    location: {
                        branchCode: {
                            $eq: (typeof screeningRoomBranchCode === 'string' && screeningRoomBranchCode.length > 0)
                                ? screeningRoomBranchCode
                                : undefined
                        }
                    }
                }
            };

            if (format === 'table') {
                const limit = Number(req.query.limit);
                const page = Number(req.query.page);
                const { data } = await eventService.search({
                    ...searchConditions,
                    limit: limit,
                    page: page,
                    inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ')
                        .add(1, 'day')
                        .toDate()
                });

                res.json({
                    success: true,
                    count: (data.length === Number(limit))
                        ? (Number(page) * Number(limit)) + 1
                        : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                    results: data
                });
            } else {
                const searchScreeningRoomsResult = await placeService.searchScreeningRooms({
                    limit: 100,
                    project: { id: { $eq: req.project.id } },
                    branchCode: {
                        $eq: (typeof screeningRoomBranchCode === 'string' && screeningRoomBranchCode.length > 0)
                            ? screeningRoomBranchCode
                            : undefined
                    },
                    containedInPlace: {
                        id: { $eq: locationId }
                    }
                });

                // カレンダー表示の場合すべて検索する
                const limit = 100;
                let page = 0;
                let numData: number = limit;
                const events: chevre.factory.event.IEvent<chevre.factory.eventType.ScreeningEvent>[] = [];
                while (numData === limit) {
                    page += 1;
                    const searchEventsResult = await eventService.search({
                        ...searchConditions,
                        limit: limit,
                        page: page
                    });
                    numData = searchEventsResult.data.length;
                    events.push(...searchEventsResult.data);
                }

                const searchTicketTypeGroupsResult = await offerCatalogService.search({
                    project: { id: { $eq: req.project.id } },
                    itemOffered: { typeOf: { $eq: ProductType.EventService } }
                });

                res.json({
                    performances: events,
                    screens: searchScreeningRoomsResult.data,
                    ticketGroups: searchTicketTypeGroupsResult.data
                });
            }
        } catch (err) {
            res.status(INTERNAL_SERVER_ERROR)
                .json({
                    message: err.message,
                    error: err.message
                });
        }
    }
);

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
