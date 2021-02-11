/**
 * ダッシュボードルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as cinerinoapi from '@cinerino/sdk';
import { Router } from 'express';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status';

const dashboardRouter = Router();

/**
 * ダッシュボード
 */
dashboardRouter.get(
    '',
    async (req, res, next) => {
        try {
            // if (req.query.next !== undefined) {
            //     next(new Error(req.param('next')));

            //     return;
            // }

            // 管理プロジェクト検索
            const projectService = new cinerinoapi.service.Project({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient
            });

            const { data } = await projectService.search({ limit: 2 });

            // プロジェクトが1つのみであれば、プロジェクトホームへ自動遷移
            if (data.length === 1) {
                res.redirect(`/dashboard/projects/${data[0].id}/select`);

                return;
            }

            res.render(
                'dashboard',
                { layout: 'layouts/dashboard' }
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクト検索
 */
dashboardRouter.get(
    '/dashboard/projects',
    async (req, res) => {
        try {
            // 管理プロジェクト検索
            const projectService = new cinerinoapi.service.Project({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchProjectsResult = await projectService.search({});

            res.json(searchProjectsResult);
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR)
                .send(error.message);
        }
    }
);

/**
 * プロジェクト選択
 */
dashboardRouter.get(
    '/dashboard/projects/:id/select',
    async (req, res, next) => {
        try {
            const projectId = req.params.id;

            try {
                const chevreProjectService = new chevre.service.Project({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                await chevreProjectService.findById({ id: projectId });
            } catch (error) {
                // プロジェクト未作成であれば初期化プロセスへ
                if (error.code === NOT_FOUND) {
                    res.redirect(`/projects/${projectId}/initialize`);

                    return;
                }

                throw error;
            }

            res.redirect(`/projects/${projectId}/home`);
        } catch (error) {
            next(error);
        }
    }
);

export default dashboardRouter;
