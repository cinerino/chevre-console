/**
 * 口座アクションルーター
 */
import * as chevreapi from '@chevre/api-nodejs-client';
import * as cinerinoapi from '@cinerino/sdk';
import { Router } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status';
import * as moment from 'moment-timezone';

export type IAction = cinerinoapi.factory.chevre.action.trade.pay.IAction | cinerinoapi.factory.chevre.action.trade.refund.IAction;
export interface IAccountingReoprt {
    mainEntity: IAction;
    isPartOf: {
        mainEntity: cinerinoapi.factory.order.IOrder;
    };
}

const accountActionsRouter = Router();

accountActionsRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const accountActionService = new chevreapi.service.AccountAction({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            if (req.query.format === 'datatable') {
                const searchConditions: chevreapi.factory.account.action.moneyTransfer.ISearchConditions = {
                    limit: req.query.limit,
                    page: req.query.page,
                    sort: { startDate: chevreapi.factory.sortType.Descending },
                    location: {
                        accountNumber: {
                            $eq: (typeof req.query.location?.accountNumber === 'string' && req.query.location.accountNumber.length > 0)
                                ? req.query.location.accountNumber
                                : undefined
                        },
                        typeOf: {
                            $eq: (typeof req.query.location?.typeOf === 'string' && req.query.location.typeOf.length > 0)
                                ? req.query.location.typeOf
                                : undefined
                        }
                    },
                    amount: {
                        currency: {
                            $eq: (typeof req.query.amount?.currency === 'string' && req.query.amount.currency.length > 0)
                                ? req.query.amount.currency
                                : undefined
                        }
                    },
                    actionStatus: {
                        $in: (typeof req.query.actionStatus?.$eq === 'string' && req.query.actionStatus.$eq.length > 0)
                            ? [req.query.actionStatus.$eq]
                            : undefined
                    },
                    purpose: {
                        typeOf: {
                            $eq: (typeof req.query.purpose?.typeOf === 'string' && req.query.purpose.typeOf.length > 0)
                                ? req.query.purpose.typeOf
                                : undefined
                        },
                        id: {
                            $eq: (typeof req.query.purpose?.id === 'string' && req.query.purpose.id.length > 0)
                                ? req.query.purpose.id
                                : undefined
                        },
                        identifier: {
                            $eq: (typeof req.query.purpose?.identifier === 'string' && req.query.purpose.identifier.length > 0)
                                ? req.query.purpose.identifier
                                : undefined
                        }
                    }
                };
                const searchResult = await accountActionService.search(searchConditions);

                searchResult.data = searchResult.data.map((a) => {

                    return {
                        ...a
                    };
                });

                res.json({
                    success: true,
                    count: (searchResult.data.length === Number(searchConditions.limit))
                        ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                        : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(searchResult.data.length),
                    results: searchResult.data
                });
            } else {
                res.render('accountActions/index', {
                    moment: moment,
                    query: req.query,
                    ActionStatusType: chevreapi.factory.actionStatusType
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

export default accountActionsRouter;
