/**
 * 承認ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment';

import { orderStatusTypes } from '../factory/orderStatusType';

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

export default authorizationsRouter;
