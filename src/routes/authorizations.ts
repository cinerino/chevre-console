/**
 * 承認ルーター
 */
import { chevre } from '@cinerino/sdk';
import { Router } from 'express';
import * as moment from 'moment';

import { orderStatusTypes } from '../factory/orderStatusType';
import * as TimelineFactory from '../factory/timeline';

const authorizationsRouter = Router();

authorizationsRouter.get(
    '',
    async (__, res) => {
        res.render('authorizations/index', {
            message: '',
            orderStatusTypes
        });
    }
);

authorizationsRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const authorizationService = new chevre.service.Authorization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchConditions: chevre.factory.authorization.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                project: { id: { $eq: req.project.id } },
                code: {
                    $in: (typeof req.query.code === 'string' && req.query.code.length > 0)
                        ? [req.query.code]
                        : undefined
                },
                validFrom: (typeof req.query.validFrom === 'string' && req.query.validFrom.length > 0)
                    ? moment(`${String(req.query.validFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate()
                    : undefined,
                validThrough: (typeof req.query.validThrough === 'string' && req.query.validThrough.length > 0)
                    ? moment(`${String(req.query.validThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .add(1, 'day')
                        .toDate()
                    : undefined,
                object: {
                    typeOfs: (typeof req.query.object?.typeOf === 'string' && req.query.object.typeOf.length > 0)
                        ? [req.query.object.typeOf]
                        : undefined,
                    ids: (typeof req.query.object?.id === 'string' && req.query.object.id.length > 0)
                        ? [req.query.object.id]
                        : undefined
                    // typeOfGood?: {
                    //     typeOfs?: string[];
                    //     ids?: string[];
                    // };}
                }
            };
            const { data } = await authorizationService.search(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((authorization) => {
                    return {
                        ...authorization
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

authorizationsRouter.all(
    '/:id',
    async (req, res, next) => {
        try {
            const message = undefined;

            const actionService = new chevre.service.Action({
                endpoint: <string>process.env.CHEVRE_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });
            const authorizationService = new chevre.service.Authorization({
                endpoint: <string>process.env.CHEVRE_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchAuthorizationsResult = await authorizationService.search({
                limit: 1,
                id: { $in: [req.params.id] },
                project: { id: { $eq: req.project.id } }
            });
            const authorization = searchAuthorizationsResult.data.shift();
            if (authorization === undefined) {
                throw new chevre.factory.errors.NotFound('Authorization');
            }

            // アクション
            const actionsOnAuthorizations: chevre.factory.action.IAction<chevre.factory.action.IAttributes<any, any, any>>[] = [];
            const timelines: TimelineFactory.ITimeline[] = [];

            try {
                // コード発行
                const searchAuthorizeActionsResult = await actionService.search({
                    limit: 100,
                    sort: { startDate: chevre.factory.sortType.Ascending },
                    project: { id: { $eq: req.project.id } },
                    typeOf: chevre.factory.actionType.AuthorizeAction,
                    result: {
                        typeOf: { $in: ['Authorization'] },
                        // id: { $in: [(<any>authorization).id] }
                        ...{
                            code: { $in: [authorization.code] }
                        }
                    }
                });
                actionsOnAuthorizations.push(...searchAuthorizeActionsResult.data);

                timelines.push(...actionsOnAuthorizations.map((a) => {
                    return TimelineFactory.createFromAction({
                        project: req.project,
                        action: a
                    });
                }));
            } catch (error) {
                // no op
            }

            res.render('authorizations/show', {
                moment: moment,
                message: message,
                authorization: authorization,
                timelines: timelines
            });
        } catch (error) {
            next(error);
        }
    }
);

export default authorizationsRouter;
