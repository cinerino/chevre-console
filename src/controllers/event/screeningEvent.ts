/**
 * 上映イベントコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as moment from 'moment';

import User from '../../user';

import { ProductType } from '../../factory/productType';

const debug = createDebug('chevre-backend:controllers');

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

export async function index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
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

        res.render('events/screeningEvent/index', {
            movieTheaters: searchMovieTheatersResult.data,
            moment: moment,
            ticketGroups: searchTicketTypeGroupsResult.data
        });
    } catch (err) {
        next(err);
    }
}

/**
 * 作品検索
 */
export async function searchScreeningEventSeries(req: Request, res: Response): Promise<void> {
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
/**
 * 新規登録
 */
export async function regist(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        addValidation(req);
        const validatorResult = await req.getValidationResult();
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
            error: err.message
        };
        if (err.code === BAD_REQUEST) {
            res.status(err.code)
                .json(obj);
        } else {
            res.json(obj);
        }
    }
}
/**
 * 更新
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        updateValidation(req);
        const validatorResult = await req.getValidationResult();
        // const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            throw new Error('Invalid');
        }
        debug('saving screening event...', req.body);
        const attributes = await createEventFromBody(req);
        await eventService.update({
            id: req.params.eventId,
            attributes: attributes
        });
        res.json({
            error: undefined
        });
    } catch (err) {
        debug('update error', err);
        res.json({
            error: err.message
        });
    }
}

/**
 * 物理削除ではなくイベントキャンセル
 */
export async function cancelPerformance(req: Request, res: Response): Promise<void> {
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

/**
 * リクエストボディからイベントオブジェクトを作成する
 */
// tslint:disable-next-line:max-func-body-length
async function createEventFromBody(req: Request): Promise<chevre.factory.event.screeningEvent.IAttributes> {
    const body = req.body;
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

    const screeningEventSeries = await eventService.findById<chevre.factory.eventType.ScreeningEventSeries>({
        id: body.screeningEventId
    });

    const movieTheater = await placeService.findMovieTheaterById({ id: body.theater });

    const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
    if (screeningRoom === undefined) {
        throw new Error('上映スクリーンが見つかりません');
    }
    if (screeningRoom.name === undefined) {
        throw new Error('上映スクリーン名が見つかりません');
    }

    const catalog = await offerCatalogService.findById({ id: body.ticketTypeGroup });
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
    if (body.endSaleTimeAfterScreening !== undefined && body.endSaleTimeAfterScreening !== '') {
        offersValidAfterStart = Number(body.endSaleTimeAfterScreening);
    } else if (movieTheater.offers !== undefined
        && movieTheater.offers.availabilityEndsGraceTime !== undefined
        && movieTheater.offers.availabilityEndsGraceTime.value !== undefined) {
        // tslint:disable-next-line:no-magic-numbers
        offersValidAfterStart = Math.floor(movieTheater.offers.availabilityEndsGraceTime.value / 60);
    } else {
        offersValidAfterStart = DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES;
    }

    const doorTime = moment(`${body.day}T${body.doorTime}+09:00`, 'YYYYMMDDTHHmmZ')
        .toDate();
    const startDate = moment(`${body.day}T${body.startTime}+09:00`, 'YYYYMMDDTHHmmZ')
        .toDate();
    const endDate = moment(`${body.endDay}T${body.endTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
        .toDate();
    const salesStartDate = moment(`${body.saleStartDate}T${body.saleStartTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
        .toDate();
    const salesEndDate = moment(startDate)
        .add(offersValidAfterStart, 'minutes')
        .toDate();

    // オンライン表示開始日時は、絶対指定or相対指定
    const onlineDisplayStartDate = (String(body.onlineDisplayType) === OnlineDisplayType.Relative)
        ? moment(`${moment(startDate)
            .tz('Asia/Tokyo')
            .format('YYYY-MM-DD')}T00:00:00+09:00`)
            .add(Number(body.onlineDisplayStartDate) * -1, 'days')
            .toDate()
        : moment(`${String(body.onlineDisplayStartDate)}T${String(body.onlineDisplayStartTime)}:00+09:00`, 'YYYY/MM/DDTHHmm:ssZ')
            .toDate();

    let acceptedPaymentMethod: chevre.factory.paymentMethodType[] | undefined;
    // ムビチケ除外の場合は対応決済方法を追加
    if (body.mvtkExcludeFlg === '1') {
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

    const serviceOutput: chevre.factory.event.screeningEvent.IServiceOutput = (body.reservedSeatsAvailable === '1')
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
            maxValue: Number(body.maxSeatNumber),
            value: 1
        },
        itemOffered: {
            serviceType: serviceType,
            serviceOutput: serviceOutput
        },
        validFrom: salesStartDate,
        validThrough: salesEndDate,
        acceptedPaymentMethod: acceptedPaymentMethod
    };

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
            address: screeningRoom.address
        },
        superEvent: screeningEventSeries,
        name: screeningEventSeries.name,
        eventStatus: chevre.factory.eventStatusType.EventScheduled,
        offers: offers,
        checkInCount: <any>undefined,
        attendeeCount: <any>undefined,
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
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
    const body = req.body;
    debug('body:', body);

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

    const screeningEventSeries = await eventService.findById<chevre.factory.eventType.ScreeningEventSeries>({
        id: body.screeningEventId
    });

    const movieTheater = await placeService.findMovieTheaterById({ id: body.theater });

    const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
    if (screeningRoom === undefined) {
        throw new Error('上映スクリーンが見つかりません');
    }
    if (screeningRoom.name === undefined) {
        throw new Error('上映スクリーン名が見つかりません');
    }

    const startDate = moment(`${body.startDate}T00:00:00+09:00`, 'YYYYMMDDTHHmmZ')
        .tz('Asia/Tokyo');
    const toDate = moment(`${body.toDate}T00:00:00+09:00`, 'YYYYMMDDTHHmmZ')
        .tz('Asia/Tokyo');
    const weekDays: string[] = body.weekDayData;
    const ticketTypeIds: string[] = body.ticketData;
    const mvtkExcludeFlgs: string[] = body.mvtkExcludeFlgData;
    const timeData: { doorTime: string; startTime: string; endTime: string; endDayRelative: string }[] = body.timeData;

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
                const offersValidAfterStart = (body.endSaleTimeAfterScreening !== undefined && body.endSaleTimeAfterScreening !== '')
                    ? Number(body.endSaleTimeAfterScreening)
                    : DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES;
                const eventStartDate = moment(`${formattedDate}T${data.startTime}+09:00`, 'YYYY/MM/DDTHHmmZ')
                    .toDate();
                const salesEndDate = moment(eventStartDate)
                    .add(offersValidAfterStart, 'minutes')
                    .toDate();
                const endDayRelative = Number(data.endDayRelative);
                // tslint:disable-next-line:no-magic-numbers
                if (endDayRelative < 0 || endDayRelative > 3) {
                    throw new Error('終了日の相対設定が不適切です');
                }
                const formattedEndDate = moment(date)
                    .add(endDayRelative, 'days')
                    .format('YYYY/MM/DD');

                // 販売開始日時は、劇場設定 or 絶対指定 or 相対指定
                let salesStartDate: Date;
                switch (String(body.saleStartDateType)) {
                    case SaleStartDateType.Absolute:
                        salesStartDate = moment(`${String(body.saleStartDate)}T${body.saleStartTime}:00+09:00`, 'YYYY/MM/DDTHHmm:ssZ')
                            .toDate();
                        break;

                    case SaleStartDateType.Relative:
                        salesStartDate = moment(`${moment(eventStartDate)
                            .tz('Asia/Tokyo')
                            .format('YYYY-MM-DD')}T00:00:00+09:00`)
                            .add(Number(body.saleStartDate) * -1, 'days')
                            .toDate();
                        break;

                    default:
                        salesStartDate = moment(`${formattedDate}T0000+09:00`, 'YYYY/MM/DDTHHmmZ')
                            .add(parseInt(body.saleStartDays, 10) * -1, 'day')
                            .toDate();
                }

                // オンライン表示開始日時は、絶対指定or相対指定
                const onlineDisplayStartDate = (String(body.onlineDisplayType) === OnlineDisplayType.Relative)
                    ? moment(`${moment(eventStartDate)
                        .tz('Asia/Tokyo')
                        .format('YYYY-MM-DD')}T00:00:00+09:00`)
                        .add(Number(body.onlineDisplayStartDate) * -1, 'days')
                        .toDate()
                    // tslint:disable-next-line:max-line-length
                    : moment(`${String(body.onlineDisplayStartDate)}T${String(body.onlineDisplayStartTime)}:00+09:00`, 'YYYY/MM/DDTHHmm:ssZ')
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

                const serviceOutput: chevre.factory.event.screeningEvent.IServiceOutput = (body.reservedSeatsAvailable === '1')
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
                        maxValue: Number(body.maxSeatNumber),
                        value: 1
                    },
                    itemOffered: {
                        serviceType: serviceType,
                        serviceOutput: serviceOutput
                    },
                    validFrom: salesStartDate,
                    validThrough: salesEndDate,
                    acceptedPaymentMethod: acceptedPaymentMethod
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
                        address: screeningRoom.address
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
function addValidation(req: Request): void {
    req.checkBody('screeningEventId', '上映イベントシリーズが未選択です')
        .notEmpty();
    req.checkBody('startDate', '上映日が未選択です')
        .notEmpty();
    req.checkBody('toDate', '上映日が未選択です')
        .notEmpty();
    req.checkBody('weekDayData', '曜日が未選択です')
        .notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です')
        .notEmpty();
    req.checkBody('theater', '劇場が未選択です')
        .notEmpty();
    req.checkBody('timeData', '時間情報が未選択です')
        .notEmpty();
    req.checkBody('ticketData', '券種グループが未選択です')
        .notEmpty();
}
/**
 * 編集バリデーション
 */
function updateValidation(req: Request): void {
    req.checkBody('screeningEventId', '上映イベントシリーズが未選択です')
        .notEmpty();
    req.checkBody('day', '上映日が未選択です')
        .notEmpty();
    req.checkBody('doorTime', '開場時刻が未選択です')
        .notEmpty();
    req.checkBody('startTime', '開始時刻が未選択です')
        .notEmpty();
    req.checkBody('endTime', '終了時刻が未選択です')
        .notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です')
        .notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です')
        .notEmpty();
}
