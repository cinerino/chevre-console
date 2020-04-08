/**
 * 取引ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

const debug = createDebug('chevre-console:router');
const transactionsRouter = express.Router();

/**
 * 取引検索
 */
transactionsRouter.get(
    '/',
    async (req, _, next) => {
        try {
            debug('searching transactions...', req.query);
            throw new Error('Not implemented');
        } catch (error) {
            next(error);
        }
    });

/**
 * 予約取引開始
 */
transactionsRouter.all(
    '/reserve/start',
    async (req, res, next) => {
        try {
            let values: any = {};
            let message = '';

            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = await eventService.findById({ id: req.query.event });
            const offers = await eventService.searchTicketOffers({ id: event.id });
            const selectedOffer = offers[0];
            if (selectedOffer === undefined) {
                throw new Error('selectedOffer undefined');
            }

            if (req.method === 'POST') {
                values = req.body;

                try {
                    const reserveService = new chevre.service.transaction.Reserve({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });

                    const expires = moment()
                        .add(1, 'minutes')
                        .toDate();
                    debug('取引を開始します...', values);
                    let transaction = await reserveService.start({
                        project: req.project,
                        typeOf: chevre.factory.transactionType.Reserve,
                        expires: expires,
                        agent: {
                            typeOf: 'Person',
                            id: req.user.profile.sub,
                            name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                        },
                        object: {
                        }
                    });
                    debug('取引が開始されました。', transaction.id);

                    const numSeats = Number(req.body.numSeats);

                    transaction = await reserveService.addReservations({
                        id: transaction.id,
                        object: {
                            // tslint:disable-next-line:prefer-array-literal
                            acceptedOffer: [...Array(numSeats)].map(() => {
                                return {
                                    id: <string>selectedOffer.id,
                                    itemOffered: {
                                        serviceOutput: {
                                            typeOf: chevre.factory.reservationType.EventReservation,
                                            // additionalProperty?: IPropertyValue < string > [];
                                            additionalTicketText: req.body.additionalTicketText,
                                            reservedTicket: {
                                                typeOf: 'Ticket',
                                                /**
                                                 * 予約座席指定
                                                 * 指定席イベントの場合、座席を指定
                                                 * 自由席イベントの場合、あるいは、最大収容人数がないイベントの場合は、座席指定不要
                                                 */
                                                // ticketedSeat?: ReservationFactory.ISeat;
                                            };
                                        }
                                    }
                                };
                            }),
                            event: {
                                id: event.id
                            }
                            // onReservationStatusChanged?: IOnReservationStatusChanged;
                        }
                    });

                    // セッションに取引追加
                    (<Express.Session>req.session)[`transaction:${transaction.id}`] = transaction;

                    res.redirect(`/transactions/reserve/${transaction.id}/confirm`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }

            res.render('transactions/reserve/start', {
                values: values,
                message: message,
                event: event
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 予約取引確認
 */
transactionsRouter.all(
    '/reserve/:transactionId/confirm',
    async (req, res, next) => {
        try {
            let message = '';
            const transaction = <chevre.factory.transaction.reserve.ITransaction>
                (<Express.Session>req.session)[`transaction:${req.params.transactionId}`];
            if (transaction === undefined) {
                throw new chevre.factory.errors.NotFound('Transaction in session');
            }

            const eventId = transaction.object.reservationFor?.id;
            if (typeof eventId !== 'string') {
                throw new chevre.factory.errors.NotFound('Event not specified');
            }

            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = await eventService.findById({ id: eventId });

            if (req.method === 'POST') {
                // 確定
                const reserveService = new chevre.service.transaction.Reserve({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                await reserveService.confirm({ id: transaction.id });
                debug('取引確定です。');
                message = '予約取引を実行しました。';
                // セッション削除
                // tslint:disable-next-line:no-dynamic-delete
                delete (<Express.Session>req.session)[`transaction:${transaction.id}`];
                req.flash('message', message);
                res.redirect(`/transactions/reserve/start?event=${event.id}`);

                return;
            } else {
                // 入金先口座情報を検索
                // const accountService = new pecorinoapi.service.Account({
                //     endpoint: <string>process.env.API_ENDPOINT,
                //     auth: req.user.authClient
                // });
                // const searchAccountsResult = await accountService.search({
                //     accountType: transaction.object.toLocation.accountType,
                //     accountNumbers: [transaction.object.toLocation.accountNumber],
                //     statuses: [],
                //     limit: 1
                // });
                // toAccount = searchAccountsResult.data.shift();
                // if (toAccount === undefined) {
                //     throw new Error('To Location Not Found');
                // }
            }

            res.render('transactions/reserve/confirm', {
                transaction: transaction,
                message: message,
                event: event
            });
        } catch (error) {
            next(error);
        }
    }
);

export default transactionsRouter;
