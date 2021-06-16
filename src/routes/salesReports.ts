/**
 * 旧売上レポートルーター
 */
import { chevre } from '@cinerino/sdk';
import { Router } from 'express';
import * as moment from 'moment-timezone';

export type IAction = chevre.factory.chevre.action.trade.pay.IAction | chevre.factory.chevre.action.trade.refund.IAction;
export interface IAccountingReoprt {
    mainEntity: IAction;
    isPartOf: {
        mainEntity: chevre.factory.order.IOrder;
    };
}

const salesReportsRouter = Router();

salesReportsRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const salesReportService = new chevre.service.SalesReport({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
                // project: req.project
            });

            const searchConditions: any = {
                limit: req.query.limit,
                page: req.query.page
            };

            if (req.query.format === 'datatable') {
                const conditions: any = {
                    limit: Number(searchConditions.limit),
                    page: Number(searchConditions.page),
                    $and: [
                        { 'project.id': { $exists: true, $eq: req.project?.id } },
                        ...(typeof req.query.category === 'string' && req.query.category.length > 0)
                            ? [{ category: { $eq: req.query.category } }]
                            : [],
                        ...(typeof req.query.confirmationNumber === 'string' && req.query.confirmationNumber.length > 0)
                            ? [{ 'mainEntity.confirmationNumber': { $exists: true, $eq: req.query.confirmationNumber } }]
                            : [],
                        ...(typeof req.query.customerGroup === 'string' && req.query.customerGroup.length > 0)
                            ? [{ 'mainEntity.customer.group': { $exists: true, $eq: req.query.customerGroup } }]
                            : [],
                        ...(typeof req.query.eventId === 'string' && req.query.eventId.length > 0)
                            ? [{ 'reservation.reservationFor.id': { $exists: true, $eq: req.query.eventId } }]
                            : [],
                        ...(typeof req.query.reservationId === 'string' && req.query.reservationId.length > 0)
                            ? [{ 'reservation.id': { $exists: true, $eq: req.query.reservationId } }]
                            : [],
                        ...(typeof req.query.recordedFrom === 'string' && req.query.recordedFrom.length > 0)
                            ? [{
                                dateRecorded: {
                                    $gte: moment(`${String(req.query.recordedFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                                        .toDate()
                                }
                            }]
                            : [],
                        ...(typeof req.query.recordedThrough === 'string' && req.query.recordedThrough.length > 0)
                            ? [{
                                dateRecorded: {
                                    $lt: moment(`${String(req.query.recordedThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                                        .add(1, 'days')
                                        .toDate()
                                }
                            }]
                            : [],
                        ...(typeof req.query.reservationForStartFrom === 'string' && req.query.reservationForStartFrom.length > 0)
                            ? [{
                                'reservation.reservationFor.startDate': {
                                    $exists: true,
                                    $gte: moment(`${String(req.query.reservationForStartFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                                        .toDate()
                                }
                            }]
                            : [],
                        ...(typeof req.query.reservationForStartThrough === 'string' && req.query.reservationForStartThrough.length > 0)
                            ? [{
                                'reservation.reservationFor.startDate': {
                                    $exists: true,
                                    $lt: moment(`${String(req.query.reservationForStartThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                                        .add(1, 'days')
                                        .toDate()
                                }
                            }]
                            : []
                    ]
                };
                const searchResult = await salesReportService.search(conditions);

                res.json({
                    success: true,
                    count: (searchResult.data.length === Number(searchConditions.limit))
                        ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                        : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(searchResult.data.length),
                    results: searchResult.data
                });
            } else {
                res.render('salesReports/index', {
                    moment: moment,
                    query: req.query,
                    searchConditions: searchConditions
                    // extractScripts: true
                });
            }
        } catch (error) {
            next(error);
        }
    }
);

export default salesReportsRouter;
