/**
 * 作品コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
// import * as createDebug from 'debug';
import { Router } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as MovieController from '../../controllers/creativeWork/movie';

const movieRouter = Router();

movieRouter.all('/add', MovieController.add);

movieRouter.all(
    '',
    (__, res) => {
        res.render(
            'creativeWorks/movie/index',
            {}
        );
    }
);

movieRouter.all(
    '/getlist',
    async (req, res) => {
        try {
            const creativeWorkService = new chevre.service.CreativeWork({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchDistributorTypesResult = await categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
            });
            const distributorTypes = searchDistributorTypesResult.data;

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await creativeWorkService.searchMovies({
                limit: limit,
                page: page,
                sort: { identifier: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                identifier: req.query.identifier,
                name: req.query.name,
                datePublishedFrom: (!_.isEmpty(req.query.datePublishedFrom))
                    ? moment(`${req.query.datePublishedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate() : undefined,
                datePublishedThrough: (!_.isEmpty(req.query.datePublishedThrough))
                    ? moment(`${req.query.datePublishedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate()
                    : undefined,
                offers: {
                    availableFrom: (!_.isEmpty(req.query.availableFrom))
                        ? moment(`${req.query.availableFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                            .toDate()
                        : undefined,
                    availableThrough: (!_.isEmpty(req.query.availableThrough)) ?
                        moment(`${req.query.availableThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                            .toDate() : undefined
                }
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((d) => {
                    const distributorType = distributorTypes.find(
                        (distributorType) => distributorType.codeValue === (<any>d).distributor?.codeValue
                    );

                    return {
                        ...d,
                        ...(distributorType !== undefined) ? { distributorName: (<any>distributorType.name).ja } : undefined
                    };
                })
            });
        } catch (error) {
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    }
);

movieRouter.all('/:id/update', MovieController.update);

export default movieRouter;
