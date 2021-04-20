/**
 * 所有権ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment';

import { orderStatusTypes } from '../factory/orderStatusType';

const ownershipInfosRouter = Router();

ownershipInfosRouter.get(
    '',
    async (__, res) => {
        res.render('ownershipInfos/index', {
            message: '',
            orderStatusTypes
        });
    }
);

ownershipInfosRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const ownershipInfoService = new chevre.service.OwnershipInfo({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchConditions: chevre.factory.ownershipInfo.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                project: { id: { $eq: req.project.id } },
                ids: (typeof req.query.id?.$eq === 'string' && req.query.id.$eq.length > 0)
                    ? [req.query.id.$eq]
                    : undefined,
                ownedFrom: (typeof req.query.ownedFrom === 'string' && req.query.ownedFrom.length > 0)
                    ? moment(`${String(req.query.ownedFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate()
                    : undefined,
                ownedThrough: (typeof req.query.ownedThrough === 'string' && req.query.ownedThrough.length > 0)
                    ? moment(`${String(req.query.ownedThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .add(1, 'day')
                        .toDate()
                    : undefined,
                ownedBy: {
                    id: (typeof req.query.ownedBy?.id === 'string' && req.query.ownedBy.id.length > 0)
                        ? req.query.ownedBy.id
                        : undefined
                },
                typeOfGood: {
                    typeOf: (typeof req.query.typeOfGood?.typeOf === 'string' && req.query.typeOfGood.typeOf.length > 0)
                        ? { $eq: req.query.typeOfGood.typeOf }
                        : undefined
                }
            };
            const { data } = await ownershipInfoService.search(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((ownershipInfo) => {
                    return {
                        ...ownershipInfo
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

export default ownershipInfosRouter;
