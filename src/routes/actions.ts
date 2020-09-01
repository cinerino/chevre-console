/**
 * アクションルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
// import * as cinerino from '@cinerino/sdk';
import { Router } from 'express';
// import { INTERNAL_SERVER_ERROR, NO_CONTENT } from 'http-status';
// import * as moment from 'moment';

const actionsRouter = Router();

actionsRouter.get(
    '',
    async (__, res) => {
        res.render('actions/index', {
            message: '',
            ActionType: chevre.factory.actionType
            // reservationStatusType: chevre.factory.reservationStatusType,
            // reservationStatusTypes: reservationStatusTypes,
            // ticketTypeCategories: searchOfferCategoryTypesResult.data,
            // movieTheaters: searchMovieTheatersResult.data
        });
    }
);

actionsRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const actionService = new chevre.service.Action({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchConditions: chevre.factory.action.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                project: { id: { $eq: req.project.id } },
                typeOf: {
                    $eq: (typeof req.query.typeOf?.$eq === 'string' && req.query.typeOf.$eq.length > 0)
                        ? req.query.typeOf.$eq
                        : undefined
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

                    return {
                        ...a,
                        objectType
                        // application: application,
                        // reservationStatusTypeName: reservationStatusType?.name,
                        // checkedInText: (t.checkedIn === true) ? 'done' : undefined,
                        // attendedText: (t.attended === true) ? 'done' : undefined,
                        // unitPriceSpec: unitPriceSpec,
                        // ticketedSeat: ticketedSeatStr
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
