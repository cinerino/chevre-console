/**
 * 上映イベント管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as cinerino from '@cinerino/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, NO_CONTENT } from 'http-status';
import * as moment from 'moment';

import User from '../../user';

import { ProductType } from '../../factory/productType';

const DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES = -20;

enum SaleStartDateType {
    Default = 'default',
    Absolute = 'absolute',
    Relative = 'relative'
}

enum OnlineDisplayType {
    Absolute = 'absolute',
    Relative = 'relative'
}

const debug = createDebug('chevre-backend:routes');

const screeningEventRouter = Router();

screeningEventRouter.get(
    '',
    async (req, res, next) => {
        try {
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const sellerService = new cinerino.service.Seller({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchMovieTheatersResult = await placeService.searchMovieTheaters({
                project: { ids: [req.project.id] }
            });
            if (searchMovieTheatersResult.data.length === 0) {
                throw new Error('劇場が見つかりません');
            }

            const searchTicketTypeGroupsResult = await offerCatalogService.search({
                project: { id: { $eq: req.project.id } },
                itemOffered: { typeOf: { $eq: ProductType.EventService } }
            });

            const searchSellersResult = await sellerService.search({});

            res.render('events/screeningEvent/index', {
                movieTheaters: searchMovieTheatersResult.data,
                moment: moment,
                ticketGroups: searchTicketTypeGroupsResult.data,
                sellers: searchSellersResult.data
            });
        } catch (err) {
            next(err);
        }
    }
);

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
            const onlyEventScheduled = req.query.onlyEventScheduled === '1';

            const searchConditions: chevre.factory.event.ISearchConditions<chevre.factory.eventType.ScreeningEvent>
                = {
                project: { ids: [req.project.id] },
                typeOf: chevre.factory.eventType.ScreeningEvent,
                eventStatuses: (onlyEventScheduled) ? [chevre.factory.eventStatusType.EventScheduled] : undefined,
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

screeningEventRouter.get(
    '/searchScreeningEventSeries',
    async (req, res) => {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        try {
            const searchResult = await eventService.search({
                project: { ids: [req.project.id] },
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                location: {
                    branchCodes: [req.query.movieTheaterBranchCode]
                },
                workPerformed: {
                    identifiers: [req.query.identifier]
                }
            });
            res.json({
                error: undefined,
                screeningEventSeries: searchResult.data
            });
        } catch (err) {
            debug('searchScreeningEvent error', err);
            res.json({
                error: err.message
            });
        }
    }
);

screeningEventRouter.post<any>(
    '/regist',
    ...addValidation(),
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const validatorResult = validationResult(req);
            // errors = validatorResult.mapped();
            // const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                throw new Error('Invalid');
            }

            debug('saving screening event...', req.body);
            const attributes = await createMultipleEventFromBody(req, req.user);
            const events = await eventService.create(attributes);
            debug(events.length, 'events created', events.map((e) => e.id));
            res.json({
                error: undefined
            });
        } catch (err) {
            debug('regist error', err);
            const obj = {
                message: err.message,
                error: err.message
            };
            if (err.code === BAD_REQUEST) {
                res.status(err.code)
                    .json(obj);
            } else {
                res.status(INTERNAL_SERVER_ERROR)
                    .json(obj);
            }
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
screeningEventRouter.post<ParamsDictionary>(
    '/:eventId/update',
    ...updateValidation(),
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const validatorResult = validationResult(req);
            // errors = validatorResult.mapped();
            // const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                throw new Error('不適切な項目があります');
            }

            const attributes = await createEventFromBody(req);
            await eventService.update({
                id: req.params.eventId,
                attributes: attributes
            });

            res.status(NO_CONTENT)
                .end();
        } catch (err) {
            res.status(BAD_REQUEST)
                .json({
                    message: err.message,
                    error: err
                });
        }
    }
);

screeningEventRouter.put(
    '/:eventId/cancel',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = await eventService.findById({ id: req.params.eventId });
            if (moment(event.startDate)
                .tz('Asia/Tokyo')
                .isSameOrAfter(
                    moment()
                        .tz('Asia/Tokyo'),
                    'day'
                )
            ) {
                event.eventStatus = chevre.factory.eventStatusType.EventCancelled;
                await eventService.update({ id: event.id, attributes: event });

                res.json({
                    error: undefined
                });
            } else {
                res.json({
                    error: '開始日時'
                });
            }
        } catch (err) {
            debug('delete error', err);
            res.status(NO_CONTENT)
                .json({
                    error: err.message
                });
        }
    }
);

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

screeningEventRouter.get(
    '/:id/availableSeatOffers',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const event = await eventService.findById<chevre.factory.eventType.ScreeningEvent>({ id: req.params.id });

            const { data } = await eventService.searchSeats({
                id: event.id,
                limit: 100,
                page: 1,
                ...{
                    branchCode: {
                        $regex: (typeof req.query?.branchCode?.$eq === 'string'
                            && req.query?.branchCode?.$eq.length > 0)
                            ? req.query?.branchCode?.$eq
                            : undefined
                    }
                }
            });

            res.json(data);
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

/**
 * リクエストボディからイベントオブジェクトを作成する
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
async function createEventFromBody(req: Request): Promise<chevre.factory.event.screeningEvent.IAttributes> {
    const user = req.user;

    const eventService = new chevre.service.Event({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const sellerService = new cinerino.service.Seller({
        endpoint: <string>process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });

    const screeningEventSeries = await eventService.findById<chevre.factory.eventType.ScreeningEventSeries>({
        id: req.body.screeningEventId
    });

    const movieTheater = await placeService.findMovieTheaterById({ id: req.body.theater });

    const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === req.body.screen);
    if (screeningRoom === undefined) {
        throw new Error('上映スクリーンが見つかりません');
    }
    if (screeningRoom.name === undefined) {
        throw new Error('上映スクリーン名が見つかりません');
    }

    const seller = await sellerService.findById({ id: req.body.seller });

    const catalog = await offerCatalogService.findById({ id: req.body.ticketTypeGroup });
    if (typeof catalog.id !== 'string') {
        throw new Error('Offer Catalog ID undefined');
    }

    let serviceType: chevre.factory.serviceType.IServiceType | undefined;
    const offerCatagoryServiceTypeCode = catalog.itemOffered.serviceType?.codeValue;
    if (typeof offerCatagoryServiceTypeCode === 'string') {
        const searchServiceTypesResult = await categoryCodeService.search({
            limit: 1,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } },
            codeValue: { $eq: offerCatagoryServiceTypeCode }
        });
        serviceType = searchServiceTypesResult.data.shift();
        if (serviceType === undefined) {
            throw new Error('興行区分が見つかりません');
        }
    }

    let offersValidAfterStart: number;
    if (req.body.endSaleTimeAfterScreening !== undefined && req.body.endSaleTimeAfterScreening !== '') {
        offersValidAfterStart = Number(req.body.endSaleTimeAfterScreening);
    } else if (movieTheater.offers !== undefined
        && movieTheater.offers.availabilityEndsGraceTime !== undefined
        && movieTheater.offers.availabilityEndsGraceTime.value !== undefined) {
        // tslint:disable-next-line:no-magic-numbers
        offersValidAfterStart = Math.floor(movieTheater.offers.availabilityEndsGraceTime.value / 60);
    } else {
        offersValidAfterStart = DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES;
    }

    const doorTime = moment(`${req.body.day}T${req.body.doorTime}+09:00`, 'YYYYMMDDTHHmmZ')
        .toDate();
    const startDate = moment(`${req.body.day}T${req.body.startTime}+09:00`, 'YYYYMMDDTHHmmZ')
        .toDate();
    const endDate = moment(`${req.body.endDay}T${req.body.endTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
        .toDate();
    const salesStartDate = moment(`${req.body.saleStartDate}T${req.body.saleStartTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
        .toDate();
    const salesEndDate = moment(startDate)
        .add(offersValidAfterStart, 'minutes')
        .toDate();

    // オンライン表示開始日時は、絶対指定or相対指定
    const onlineDisplayStartDate = (String(req.body.onlineDisplayType) === OnlineDisplayType.Relative)
        ? moment(`${moment(startDate)
            .tz('Asia/Tokyo')
            .format('YYYY-MM-DD')}T00:00:00+09:00`)
            .add(Number(req.body.onlineDisplayStartDate) * -1, 'days')
            .toDate()
        // tslint:disable-next-line:max-line-length
        : moment(`${String(req.body.onlineDisplayStartDate)}T${String(req.body.onlineDisplayStartTime)}:00+09:00`, 'YYYY/MM/DDTHHmm:ssZ')
            .toDate();

    let acceptedPaymentMethod: chevre.factory.paymentMethodType[] | undefined;
    // ムビチケ除外の場合は対応決済方法を追加
    if (req.body.mvtkExcludeFlg === '1') {
        Object.keys(chevre.factory.paymentMethodType)
            .forEach((key) => {
                if (acceptedPaymentMethod === undefined) {
                    acceptedPaymentMethod = [];
                }
                const paymentMethodType = (<any>chevre.factory.paymentMethodType)[key];
                if (paymentMethodType !== chevre.factory.paymentMethodType.MovieTicket) {
                    acceptedPaymentMethod.push(paymentMethodType);
                }
            });
    }

    const serviceOutput: chevre.factory.event.screeningEvent.IServiceOutput = (req.body.reservedSeatsAvailable === '1')
        ? {
            typeOf: chevre.factory.reservationType.EventReservation,
            reservedTicket: {
                typeOf: 'Ticket',
                ticketedSeat: {
                    typeOf: chevre.factory.placeType.Seat
                }
            }
        }
        : {
            typeOf: chevre.factory.reservationType.EventReservation,
            reservedTicket: {
                typeOf: 'Ticket'
            }
        };

    const offers: chevre.factory.event.screeningEvent.IOffer = {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        id: catalog.id,
        name: catalog.name,
        typeOf: chevre.factory.offerType.Offer,
        priceCurrency: chevre.factory.priceCurrency.JPY,
        availabilityEnds: salesEndDate,
        availabilityStarts: onlineDisplayStartDate,
        eligibleQuantity: {
            typeOf: 'QuantitativeValue',
            unitCode: chevre.factory.unitCode.C62,
            maxValue: Number(req.body.maxSeatNumber),
            value: 1
        },
        itemOffered: {
            serviceType: serviceType,
            serviceOutput: serviceOutput
        },
        validFrom: salesStartDate,
        validThrough: salesEndDate,
        acceptedPaymentMethod: acceptedPaymentMethod,
        ...{
            seller: {
                typeOf: seller.typeOf,
                id: seller.id,
                name: seller.name
            }
        }
    };

    const maximumAttendeeCapacity = (typeof req.body.maximumAttendeeCapacity === 'string' && req.body.maximumAttendeeCapacity.length > 0)
        ? Number(req.body.maximumAttendeeCapacity)
        : undefined;
    if (typeof maximumAttendeeCapacity === 'number' && maximumAttendeeCapacity < 0) {
        throw new Error('キャパシティには正の値を入力してください');
    }
    if (req.subscription?.settings.allowNoCapacity !== true) {
        if (typeof maximumAttendeeCapacity !== 'number') {
            throw new Error('キャパシティを入力してください');
        }

        if (typeof req.subscription?.settings.maximumAttendeeCapacity === 'number') {
            if (maximumAttendeeCapacity > req.subscription?.settings.maximumAttendeeCapacity) {
                throw new Error(`キャパシティの最大値は${req.subscription?.settings.maximumAttendeeCapacity}です`);
            }
        }
    }

    return {
        project: req.project,
        typeOf: chevre.factory.eventType.ScreeningEvent,
        doorTime: doorTime,
        startDate: startDate,
        endDate: endDate,
        workPerformed: screeningEventSeries.workPerformed,
        location: {
            project: req.project,
            typeOf: <chevre.factory.placeType.ScreeningRoom>screeningRoom.typeOf,
            branchCode: <string>screeningRoom.branchCode,
            name: <chevre.factory.multilingualString>screeningRoom.name,
            alternateName: <chevre.factory.multilingualString>screeningRoom.alternateName,
            address: screeningRoom.address,
            ...(typeof maximumAttendeeCapacity === 'number') ? { maximumAttendeeCapacity } : undefined
        },
        superEvent: screeningEventSeries,
        name: screeningEventSeries.name,
        eventStatus: chevre.factory.eventStatusType.EventScheduled,
        offers: offers,
        checkInCount: <any>undefined,
        attendeeCount: <any>undefined,
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : []
    };
}
/**
 * リクエストボディからイベントオブジェクトを作成する
 */
// tslint:disable-next-line:max-func-body-length
async function createMultipleEventFromBody(req: Request, user: User): Promise<chevre.factory.event.screeningEvent.IAttributes[]> {
    const eventService = new chevre.service.Event({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const sellerService = new cinerino.service.Seller({
        endpoint: <string>process.env.CINERINO_API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });

    const screeningEventSeries = await eventService.findById<chevre.factory.eventType.ScreeningEventSeries>({
        id: req.body.screeningEventId
    });

    const movieTheater = await placeService.findMovieTheaterById({ id: req.body.theater });

    const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === req.body.screen);
    if (screeningRoom === undefined) {
        throw new Error('上映スクリーンが見つかりません');
    }
    if (screeningRoom.name === undefined) {
        throw new Error('上映スクリーン名が見つかりません');
    }

    const seller = await sellerService.findById({ id: req.body.seller });

    const maximumAttendeeCapacity = (typeof req.body.maximumAttendeeCapacity === 'string' && req.body.maximumAttendeeCapacity.length > 0)
        ? Number(req.body.maximumAttendeeCapacity)
        : undefined;
    if (typeof maximumAttendeeCapacity === 'number' && maximumAttendeeCapacity < 0) {
        throw new Error('キャパシティには正の値を入力してください');
    }
    if (req.subscription?.settings.allowNoCapacity !== true) {
        if (typeof maximumAttendeeCapacity !== 'number') {
            throw new Error('キャパシティを入力してください');
        }

        if (typeof req.subscription?.settings.maximumAttendeeCapacity === 'number') {
            if (maximumAttendeeCapacity > req.subscription?.settings.maximumAttendeeCapacity) {
                throw new Error(`キャパシティの最大値は${req.subscription?.settings.maximumAttendeeCapacity}です`);
            }
        }
    }

    const startDate = moment(`${req.body.startDate}T00:00:00+09:00`, 'YYYYMMDDTHHmmZ')
        .tz('Asia/Tokyo');
    const toDate = moment(`${req.body.toDate}T00:00:00+09:00`, 'YYYYMMDDTHHmmZ')
        .tz('Asia/Tokyo');
    const weekDays: string[] = req.body.weekDayData;
    const ticketTypeIds: string[] = req.body.ticketData;
    const mvtkExcludeFlgs: string[] = req.body.mvtkExcludeFlgData;
    const timeData: { doorTime: string; startTime: string; endTime: string; endDayRelative: string }[] = req.body.timeData;

    const searchTicketTypeGroupsResult = await offerCatalogService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        itemOffered: { typeOf: { $eq: ProductType.EventService } }
    });
    const ticketTypeGroups = searchTicketTypeGroupsResult.data;

    const searchServiceTypesResult = await categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
    });
    const serviceTypes = searchServiceTypesResult.data;

    const attributes: chevre.factory.event.screeningEvent.IAttributes[] = [];
    for (let date = startDate; date <= toDate; date = date.add(1, 'day')) {
        const formattedDate = date.format('YYYY/MM/DD');

        const day = date.get('day')
            .toString();
        if (weekDays.indexOf(day) >= 0) {
            // tslint:disable-next-line:max-func-body-length
            timeData.forEach((data, i) => {
                // tslint:disable-next-line:max-line-length
                const offersValidAfterStart = (req.body.endSaleTimeAfterScreening !== undefined && req.body.endSaleTimeAfterScreening !== '')
                    ? Number(req.body.endSaleTimeAfterScreening)
                    : DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES;
                const eventStartDate = moment(`${formattedDate}T${data.startTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
                    .toDate();
                const salesEndDate = moment(eventStartDate)
                    .add(offersValidAfterStart, 'minutes')
                    .toDate();
                const endDayRelative = Number(data.endDayRelative);
                // tslint:disable-next-line:no-magic-numbers
                if (endDayRelative < 0 || endDayRelative > 31) {
                    throw new Error('終了日の相対設定は1カ月以内で設定してください');
                }
                const formattedEndDate = moment(date)
                    .add(endDayRelative, 'days')
                    .format('YYYY/MM/DD');

                // 販売開始日時は、劇場設定 or 絶対指定 or 相対指定
                let salesStartDate: Date;
                switch (String(req.body.saleStartDateType)) {
                    case SaleStartDateType.Absolute:
                        salesStartDate = moment(`${String(req.body.saleStartDate)}T${req.body.saleStartTime}:00+09:00`, 'YYYY/MM/DDTHHmm:ssZ')
                            .toDate();
                        break;

                    case SaleStartDateType.Relative:
                        salesStartDate = moment(`${moment(eventStartDate)
                            .tz('Asia/Tokyo')
                            .format('YYYY-MM-DD')}T00:00:00+09:00`)
                            .add(Number(req.body.saleStartDate) * -1, 'days')
                            .toDate();
                        break;

                    default:
                        salesStartDate = moment(`${formattedDate}T0000+09:00`, 'YYYY/MM/DDTHHmmZ')
                            .add(parseInt(req.body.saleStartDays, 10) * -1, 'day')
                            .toDate();
                }

                // オンライン表示開始日時は、絶対指定or相対指定
                const onlineDisplayStartDate = (String(req.body.onlineDisplayType) === OnlineDisplayType.Relative)
                    ? moment(`${moment(eventStartDate)
                        .tz('Asia/Tokyo')
                        .format('YYYY-MM-DD')}T00:00:00+09:00`)
                        .add(Number(req.body.onlineDisplayStartDate) * -1, 'days')
                        .toDate()
                    // tslint:disable-next-line:max-line-length
                    : moment(`${String(req.body.onlineDisplayStartDate)}T${String(req.body.onlineDisplayStartTime)}:00+09:00`, 'YYYY/MM/DDTHHmm:ssZ')
                        .toDate();

                let acceptedPaymentMethod: chevre.factory.paymentMethodType[] | undefined;
                // ムビチケ除外の場合は対応決済方法を追加
                if (mvtkExcludeFlgs[i] === '1') {
                    Object.keys(chevre.factory.paymentMethodType)
                        .forEach((key) => {
                            if (acceptedPaymentMethod === undefined) {
                                acceptedPaymentMethod = [];
                            }
                            const paymentMethodType = (<any>chevre.factory.paymentMethodType)[key];
                            if (paymentMethodType !== chevre.factory.paymentMethodType.MovieTicket) {
                                acceptedPaymentMethod.push(paymentMethodType);
                            }
                        });
                }

                const ticketTypeGroup = ticketTypeGroups.find((t) => t.id === ticketTypeIds[i]);
                if (ticketTypeGroup === undefined) {
                    throw new Error('Ticket Type Group');
                }
                if (typeof ticketTypeGroup.id !== 'string') {
                    throw new Error('Offer Catalog ID undefined');
                }

                let serviceType: chevre.factory.serviceType.IServiceType | undefined;
                const offerCatagoryServiceTypeCode = ticketTypeGroup.itemOffered.serviceType?.codeValue;
                if (typeof offerCatagoryServiceTypeCode === 'string') {
                    serviceType = serviceTypes.find((t) => t.codeValue === offerCatagoryServiceTypeCode);
                    if (serviceType === undefined) {
                        throw new chevre.factory.errors.NotFound('サービス区分');
                    }
                }

                const serviceOutput: chevre.factory.event.screeningEvent.IServiceOutput = (req.body.reservedSeatsAvailable === '1')
                    ? {
                        typeOf: chevre.factory.reservationType.EventReservation,
                        reservedTicket: {
                            typeOf: 'Ticket',
                            ticketedSeat: { typeOf: chevre.factory.placeType.Seat }
                        }
                    } : {
                        typeOf: chevre.factory.reservationType.EventReservation,
                        reservedTicket: {
                            typeOf: 'Ticket'
                        }
                    };
                const offers: chevre.factory.event.screeningEvent.IOffer = {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    id: ticketTypeGroup.id,
                    name: ticketTypeGroup.name,
                    typeOf: chevre.factory.offerType.Offer,
                    priceCurrency: chevre.factory.priceCurrency.JPY,
                    availabilityEnds: salesEndDate,
                    availabilityStarts: onlineDisplayStartDate,
                    eligibleQuantity: {
                        typeOf: 'QuantitativeValue',
                        unitCode: chevre.factory.unitCode.C62,
                        maxValue: Number(req.body.maxSeatNumber),
                        value: 1
                    },
                    itemOffered: {
                        serviceType: serviceType,
                        serviceOutput: serviceOutput
                    },
                    validFrom: salesStartDate,
                    validThrough: salesEndDate,
                    acceptedPaymentMethod: acceptedPaymentMethod,
                    ...{
                        seller: {
                            typeOf: seller.typeOf,
                            id: seller.id,
                            name: seller.name
                        }
                    }
                };

                attributes.push({
                    project: req.project,
                    typeOf: chevre.factory.eventType.ScreeningEvent,
                    doorTime: moment(`${formattedDate}T${data.doorTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
                        .toDate(),
                    startDate: eventStartDate,
                    endDate: moment(`${formattedEndDate}T${data.endTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
                        .toDate(),
                    workPerformed: screeningEventSeries.workPerformed,
                    location: {
                        project: req.project,
                        typeOf: <chevre.factory.placeType.ScreeningRoom>screeningRoom.typeOf,
                        branchCode: <string>screeningRoom.branchCode,
                        name: screeningRoom.name === undefined
                            ? { en: '', ja: '', kr: '' }
                            : <chevre.factory.multilingualString>screeningRoom.name,
                        alternateName: <chevre.factory.multilingualString>screeningRoom.alternateName,
                        address: screeningRoom.address,
                        ...(typeof maximumAttendeeCapacity === 'number') ? { maximumAttendeeCapacity } : undefined
                    },
                    superEvent: screeningEventSeries,
                    name: screeningEventSeries.name,
                    eventStatus: chevre.factory.eventStatusType.EventScheduled,
                    offers: offers,
                    checkInCount: <any>undefined,
                    attendeeCount: <any>undefined
                });
            });
        }
    }

    return attributes;
}
/**
 * 新規登録バリデーション
 */
function addValidation() {
    return [
        body('screeningEventId', '上映イベントシリーズが未選択です')
            .notEmpty(),
        body('startDate', '上映日が未選択です')
            .notEmpty(),
        body('toDate', '上映日が未選択です')
            .notEmpty(),
        body('weekDayData', '曜日が未選択です')
            .notEmpty(),
        body('screen', 'スクリーンが未選択です')
            .notEmpty(),
        body('theater', '劇場が未選択です')
            .notEmpty(),
        body('timeData', '時間情報が未選択です')
            .notEmpty(),
        body('ticketData', '券種グループが未選択です')
            .notEmpty(),
        body('seller', '販売者が未選択です')
            .notEmpty()
    ];
}
/**
 * 編集バリデーション
 */
function updateValidation() {
    return [
        body('screeningEventId', '上映イベントシリーズが未選択です')
            .notEmpty(),
        body('day', '上映日が未選択です')
            .notEmpty(),
        body('doorTime', '開場時刻が未選択です')
            .notEmpty(),
        body('startTime', '開始時刻が未選択です')
            .notEmpty(),
        body('endTime', '終了時刻が未選択です')
            .notEmpty(),
        body('screen', 'スクリーンが未選択です')
            .notEmpty(),
        body('ticketTypeGroup', '券種グループが未選択です')
            .notEmpty(),
        body('seller', '販売者が未選択です')
            .notEmpty()
    ];
}

export default screeningEventRouter;
