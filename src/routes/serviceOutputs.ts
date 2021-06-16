/**
 * サービスアウトプットルーター
 */
import { chevre } from '@cinerino/sdk';
import { Router } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status';

const serviceOutputsRouter = Router();

serviceOutputsRouter.get(
    '',
    async (__, res) => {
        res.render('serviceOutputs/index', {
            message: ''
        });
    }
);

serviceOutputsRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const serviceOutputService = new chevre.service.ServiceOutput({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchConditions: any = {
                limit: req.query.limit,
                page: req.query.page,
                typeOf: {
                    ...(typeof req.query?.typeOf?.$eq === 'string')
                        ? { $eq: req.query?.typeOf?.$eq }
                        : { $exists: true }
                },
                identifier: (typeof req.query.identifier === 'string' && req.query.identifier.length > 0)
                    ? { $eq: req.query.identifier }
                    : undefined,
                issuedBy: {
                    id: (typeof req.query.issuedBy?.id?.$eq === 'string' && req.query.issuedBy.id.$eq.length > 0)
                        ? { $eq: req.query.issuedBy.id.$eq }
                        : undefined
                },
                issuedThrough: {
                    id: (typeof req.query.issuedThrough?.id?.$eq === 'string' && req.query.issuedThrough.id.$eq.length > 0)
                        ? { $eq: req.query.issuedThrough.id.$eq }
                        : undefined
                }
            };
            const { data } = await serviceOutputService.search(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((t) => {
                    return {
                        ...t
                    };
                })
            });
        } catch (err) {
            res.status(INTERNAL_SERVER_ERROR)
                .json({
                    success: false,
                    count: 0,
                    results: [],
                    error: { message: err.message }
                });
        }
    }
);

export default serviceOutputsRouter;
