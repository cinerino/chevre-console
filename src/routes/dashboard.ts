/**
 * ダッシュボードルーター
 */
// import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
// import { INTERNAL_SERVER_ERROR } from 'http-status';
// import * as moment from 'moment-timezone';

const dashboardRouter = Router();

dashboardRouter.get(
    '',
    async (req, res, next) => {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));

            return;
        }

        const totalCount = 1;
        const projects = [{
            typeOf: req.project.typeOf,
            id: req.project.id,
            name: req.project.name
        }];

        // プロジェクトが1つのみであれば、プロジェクトホームへ自動遷移
        if (totalCount === 1) {
            res.redirect(`/dashboard/projects/${projects[0].id}/select`);

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
        const totalCount = 1;
        const projects = [{
            typeOf: req.project.typeOf,
            id: req.project.id,
            name: req.project.name
        }];

        res.json({
            totalCount: totalCount,
            data: projects
        });
    }
);

/**
 * プロジェクト選択
 */
dashboardRouter.get(
    '/dashboard/projects/:id/select',
    async (req, res) => {
        req.project.id = req.params.id;

        res.redirect('/home');
    }
);

export default dashboardRouter;
