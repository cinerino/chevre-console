/**
 * 券種管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import { CREATED } from 'http-status';

import * as ticketTypeController from '../controllers/ticketType';

const ticketTypeCategories = [
    { id: chevre.factory.ticketTypeCategory.Default, name: '有料券' },
    { id: chevre.factory.ticketTypeCategory.Advance, name: '前売券' },
    { id: chevre.factory.ticketTypeCategory.Free, name: '無料券' }
];

const ticketTypeMasterRouter = Router();

// 券種登録
ticketTypeMasterRouter.all('/add', ticketTypeController.add);
// 券種編集
ticketTypeMasterRouter.all('/:id/update', ticketTypeController.update);

// 券種一覧
ticketTypeMasterRouter.get(
    '',
    async (req, res) => {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const ticketTypeGroupsList = await offerService.searchTicketTypeGroups({
            limit: 100,
            project: { ids: [req.project.id] }
        });

        // 券種マスタ画面遷移
        res.render('ticketType/index', {
            message: '',
            ticketTypeGroupsList: ticketTypeGroupsList.data,
            ticketTypeCategories: ticketTypeCategories
        });
    }
);

ticketTypeMasterRouter.get('/getlist', ticketTypeController.getList);
ticketTypeMasterRouter.get('/getTicketTypeGroupList/:ticketTypeId', ticketTypeController.getTicketTypeGroupList);

/**
 * COA券種インポート
 */
ticketTypeMasterRouter.post(
    '/importFromCOA',
    async (req, res, next) => {
        try {
            const placeService = new chevre.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const taskService = new chevre.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            // インポート対象の劇場ブランチコードを検索
            const { data } = await placeService.searchMovieTheaters({ limit: 100 });

            // タスク作成
            const taskAttributes = data.map((d) => {
                return {
                    project: req.project,
                    name: <chevre.factory.taskName.ImportOffersFromCOA>chevre.factory.taskName.ImportOffersFromCOA,
                    status: chevre.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 1,
                    numberOfTried: 0,
                    executionResults: [],
                    data: {
                        theaterCode: d.branchCode
                    }
                };
            });
            const tasks = await Promise.all(taskAttributes.map(async (a) => {
                return taskService.create(a);
            }));

            res.status(CREATED)
                .json(tasks);
        } catch (error) {
            next(error);
        }
    }
);

export default ticketTypeMasterRouter;
