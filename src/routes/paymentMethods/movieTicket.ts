/**
 * ムビチケ決済方法ルーター
 */
import * as chevreapi from '@chevre/api-nodejs-client';
// import * as createDebug from 'debug';
import * as express from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status';

// const debug = createDebug('cinerino-console:routes');
const movieTicketPaymentMethodRouter = express.Router();

/**
 * ムビチケ認証
 */
movieTicketPaymentMethodRouter.get(
    '/check',
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const payService = new chevreapi.service.assetTransaction.Pay({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });
            const sellerService = new chevreapi.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchSellersResult = await sellerService.search({});
            const sellers = searchSellersResult.data;

            const searchConditions: any = {
                seller: {
                    id: req.query.seller
                },
                identifier: req.query.identifier,
                accessCode: req.query.accessCode,
                serviceOutput: {
                    reservationFor: {
                        id: req.query.serviceOutput?.reservationFor?.id
                    }
                }
            };

            if (req.query.format === 'datatable') {
                const seller = sellers.find((s) => s.id === searchConditions.seller.id);
                if (seller === undefined) {
                    throw new Error(`Seller ${searchConditions.seller.id} not found`);
                }

                const paymentMethodType: string = req.query.paymentMethodType;

                const checkAction = await payService.check({
                    project: { id: req.project.id, typeOf: chevreapi.factory.organizationType.Project },
                    typeOf: chevreapi.factory.actionType.CheckAction,
                    agent: {
                        typeOf: chevreapi.factory.personType.Person,
                        id: req.user.profile.sub,
                        name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                    },
                    object: [{
                        typeOf: chevreapi.factory.service.paymentService.PaymentServiceType.MovieTicket,
                        paymentMethod: {
                            typeOf: paymentMethodType,
                            additionalProperty: [],
                            name: paymentMethodType,
                            paymentMethodId: '' // 使用されないので空でよし
                        },
                        movieTickets: [{
                            project: { typeOf: req.project.typeOf, id: req.project.id },
                            typeOf: chevreapi.factory.paymentMethodType.MovieTicket,
                            identifier: searchConditions.identifier,
                            accessCode: searchConditions.accessCode,
                            serviceType: '',
                            serviceOutput: {
                                reservationFor: {
                                    // tslint:disable-next-line:max-line-length
                                    typeOf: <chevreapi.factory.eventType.ScreeningEvent>chevreapi.factory.eventType.ScreeningEvent,
                                    id: searchConditions.serviceOutput.reservationFor.id
                                },
                                reservedTicket: {
                                    ticketedSeat: {
                                        typeOf: <chevreapi.factory.placeType.Seat>chevreapi.factory.placeType.Seat,
                                        seatNumber: '',
                                        seatRow: '',
                                        seatSection: ''
                                    }
                                }
                            }
                        }],
                        seller: {
                            typeOf: seller.typeOf,
                            id: String(seller.id)
                        }
                    }]
                });

                const result = checkAction.result;
                if (result === undefined) {
                    throw new Error('checkAction.result undefined');
                }

                // res.json({
                //     draw: req.body.draw,
                //     recordsTotal: result.movieTickets.length,
                //     recordsFiltered: result.movieTickets.length,
                //     data: result.movieTickets
                // });
                res.json({
                    success: true,
                    count: result.movieTickets.length,
                    results: result.movieTickets
                });
            } else {
                res.render('paymentMethods/movieTicket/check', {
                    // searchConditions: searchConditions,
                    // sellers: sellers
                });
            }
        } catch (error) {
            if (req.query.format === 'datatable') {
                res.status((typeof error.code === 'number') ? error.code : INTERNAL_SERVER_ERROR)
                    .json({ message: error.message });
            } else {
                next(error);
            }
        }
    }
);

export default movieTicketPaymentMethodRouter;
