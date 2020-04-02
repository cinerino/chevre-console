/**
 * ダッシュボードルーター
 */
import * as cinerinoapi from '@cinerino/api-nodejs-client';
import { Router } from 'express';

const dashboardRouter = Router();

/**
 * ダッシュボード
 */
dashboardRouter.get(
    '',
    async (req, res, next) => {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));

            return;
        }

        if (typeof process.env.PROJECT_ID === 'string') {
            res.redirect(`/dashboard/projects/${process.env.PROJECT_ID}/select`);

            return;
        }

        // 管理プロジェクト検索
        const projectService = new cinerinoapi.service.Project({
            endpoint: <string>process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });

        const { data } = await projectService.search({});

        // プロジェクトが1つのみであれば、プロジェクトホームへ自動遷移
        if (data.length === 1) {
            res.redirect(`/dashboard/projects/${data[0].id}/select`);

            return;
        }

        res.render(
            'dashboard',
            { layout: 'layouts/dashboard' }
        );
    }
);

/**
 * プロジェクト検索
 */
dashboardRouter.get(
    '/dashboard/projects',
    async (req, res) => {
        // 管理プロジェクト検索
        const projectService = new cinerinoapi.service.Project({
            endpoint: <string>process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchProjectsResult = await projectService.search({});

        res.json(searchProjectsResult);
    }
);

/**
 * プロジェクト選択
 */
dashboardRouter.get(
    '/dashboard/projects/:id/select',
    async (req, res) => {
        const projectId = req.params.id;
        (<any>req.session).projectId = projectId;

        // サブスクリプション決定
        const projectService = new cinerinoapi.service.Project({
            endpoint: <string>process.env.CINERINO_API_ENDPOINT,
            auth: req.user.authClient
        });
        const project = await projectService.findById({ id: projectId });

        let subscriptionIdentifier: string | undefined = (<any>project.settings).subscription?.identifier;
        if (subscriptionIdentifier === undefined) {
            subscriptionIdentifier = 'Business';
        }
        (<any>req.session).subscriptionIdentifier = subscriptionIdentifier;

        res.redirect('/home');
    }
);

export default dashboardRouter;
