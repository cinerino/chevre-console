/**
 * 券種グループマスタ管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
// import * as _ from 'underscore';

import * as ticketTypeGroupsController from '../controllers/ticketTypeGroup';

const ticketTypeGroupMasterRouter = Router();

ticketTypeGroupMasterRouter.all('/add', ticketTypeGroupsController.add);
ticketTypeGroupMasterRouter.all('/:id/update', ticketTypeGroupsController.update);

ticketTypeGroupMasterRouter.delete(
    '/:id',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            // 削除して問題ない券種グループかどうか検証
            const searchEventsResult = await eventService.search({
                limit: 1,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                project: { ids: [req.project.id] },
                offers: {
                    ids: [req.params.id]
                },
                sort: { endDate: chevre.factory.sortType.Descending }
            });
            if (searchEventsResult.data.length > 0) {
                if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                    throw new Error('終了していないスケジュールが存在します');
                }
            }

            await offerCatalogService.deleteById({ id: req.params.id });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            res.status(BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    }
);

// ticketTypeGroupMasterRouter.get('/ticketTypeList', ticketTypeGroupsController.getTicketTypeList);
ticketTypeGroupMasterRouter.get('', ticketTypeGroupsController.index);
// ticketTypeGroupMasterRouter.get('/getlist', ticketTypeGroupsController.getList);
ticketTypeGroupMasterRouter.get('/getTicketTypePriceList', ticketTypeGroupsController.getTicketTypePriceList);

export default ticketTypeGroupMasterRouter;
