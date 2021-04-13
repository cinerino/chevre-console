/**
 * 注文ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as cinerino from '@cinerino/sdk';
import { Router } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status';
import * as moment from 'moment';

import { orderStatusTypes } from '../factory/orderStatusType';

const ordersRouter = Router();

ordersRouter.get(
    '',
    async (__, res) => {
        res.render('orders/index', {
            message: '',
            orderStatusTypes
        });
    }
);

ordersRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const orderService = new chevre.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const iamService = new cinerino.service.IAM({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchApplicationsResult = await iamService.searchMembers({
                member: { typeOf: { $eq: chevre.factory.creativeWorkType.WebApplication } }
            });
            const applications = searchApplicationsResult.data.map((d) => d.member);

            const customerIdentifierIn: chevre.factory.propertyValue.IPropertyValue<string>[] = [];
            if (typeof req.query.application === 'string' && req.query.application.length > 0) {
                customerIdentifierIn.push({ name: 'clientId', value: req.query.application });
            }

            // let underNameIdEq: string | undefined;
            // if (typeof req.query.underName?.id === 'string' && req.query.underName?.id.length > 0) {
            //     underNameIdEq = req.query.underName?.id;
            // }

            // let brokerIdEq: string | undefined;
            // if (typeof req.query.admin?.id === 'string' && req.query.admin?.id.length > 0) {
            //     brokerIdEq = req.query.admin?.id;
            // }

            const searchConditions: chevre.factory.order.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                project: { id: { $eq: req.project.id } },
                confirmationNumbers: (typeof req.query.confirmationNumber === 'string' && req.query.confirmationNumber.length > 0)
                    ? [req.query.confirmationNumber]
                    : undefined,
                orderStatuses: (req.query.orderStatus !== undefined && req.query.orderStatus !== '')
                    ? [req.query.orderStatus]
                    : undefined,
                orderNumbers: (typeof req.query.orderNumber === 'string' && req.query.orderNumber.length > 0)
                    ? [req.query.orderNumber]
                    : undefined,
                orderDate: {
                    $gte: (typeof req.query.orderFrom === 'string' && req.query.orderFrom.length > 0)
                        ? moment(`${String(req.query.orderFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                            .toDate()
                        : undefined,
                    $lte: (typeof req.query.orderThrough === 'string' && req.query.orderThrough.length > 0)
                        ? moment(`${String(req.query.orderThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                            .add(1, 'day')
                            .toDate()
                        : undefined
                },
                customer: {
                    // name: (req.query.underName !== undefined
                    //     && req.query.underName.name !== undefined
                    //     && req.query.underName.name !== '')
                    //     ? req.query.underName.name
                    //     : undefined,
                    // email: (req.query.underName !== undefined
                    //     && req.query.underName.email !== undefined
                    //     && req.query.underName.email !== '')
                    //     ? req.query.underName.email
                    //     : undefined,
                    // telephone: (req.query.underName !== undefined
                    //     && req.query.underName.telephone !== undefined
                    //     && req.query.underName.telephone !== '')
                    //     ? req.query.underName.telephone
                    //     : undefined,
                    identifier: {
                        $in: (customerIdentifierIn.length > 0) ? customerIdentifierIn : undefined
                    }
                }
                // broker: {
                //     id: (typeof brokerIdEq === 'string')
                //         ? brokerIdEq
                //         : undefined
                // }
            };
            const { data } = await orderService.search(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((order) => {
                    let clientId: string | undefined;
                    if (Array.isArray(order.customer?.identifier)) {
                        clientId = order.customer?.identifier.find((i) => i.name === 'clientId')?.value;
                    }
                    const application = applications.find((a) => a.id === clientId);

                    const numItems = (Array.isArray(order.acceptedOffers)) ? order.acceptedOffers.length : 0;
                    const numPaymentMethods = (Array.isArray(order.paymentMethods)) ? order.paymentMethods.length : 0;

                    return {
                        ...order,
                        application: application,
                        numItems,
                        numPaymentMethods
                    };
                })
            });
        } catch (err) {
            res.json({
                message: err.message,
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

ordersRouter.get(
    '/searchAdmins',
    async (req, res) => {
        try {
            const iamService = new cinerino.service.IAM({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const limit = 10;
            const page = 1;
            const nameRegex = req.query.name;

            const { data } = await iamService.searchMembers({
                limit: limit,
                member: {
                    typeOf: { $eq: cinerino.factory.personType.Person },
                    name: { $regex: (typeof nameRegex === 'string' && nameRegex.length > 0) ? nameRegex : undefined }
                }
            });

            res.json({
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data
            });
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR)
                .json({
                    message: error.message
                });
        }
    }
);

export default ordersRouter;
