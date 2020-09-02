/**
 * アクションルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';

const actionsRouter = Router();

actionsRouter.get(
    '',
    async (__, res) => {
        res.render('actions/index', {
            message: '',
            ActionType: chevre.factory.actionType
        });
    }
);

actionsRouter.get(
    '/search',
    async (req, res) => {
        try {
            const actionService = new chevre.service.Action({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const paymentMethodIdEq = req.query.object?.paymentMethod?.paymentMethodId?.$eq;

            const searchConditions: chevre.factory.action.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                project: { id: { $eq: req.project.id } },
                typeOf: {
                    $eq: (typeof req.query.typeOf?.$eq === 'string' && req.query.typeOf.$eq.length > 0)
                        ? req.query.typeOf.$eq
                        : undefined
                },
                object: {
                    paymentMethod: {
                        paymentMethodId: {
                            $eq: (typeof paymentMethodIdEq === 'string' && paymentMethodIdEq.length > 0)
                                ? paymentMethodIdEq
                                : undefined
                        }
                    }
                }
            };
            const { data } = await actionService.search(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((a) => {

                    const objectType = (Array.isArray(a.object)) ? a.object[0]?.typeOf : a.object.typeOf;
                    const resultType = (a.result !== undefined && a.result !== null) ? '表示' : '';
                    const errorType = (a.error !== undefined && a.error !== null) ? '表示' : '';
                    const purposeType = (a.purpose !== undefined && a.purpose !== null)
                        ? String(a.purpose.typeOf)
                        : '';
                    const instrumentType = (a.instrument !== undefined && a.instrument !== null)
                        ? String(a.instrument.typeOf)
                        : '';

                    return {
                        ...a,
                        objectType,
                        resultType,
                        errorType,
                        purposeType,
                        instrumentType
                    };
                })
            });
        } catch (err) {
            console.error(err);
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

export default actionsRouter;
