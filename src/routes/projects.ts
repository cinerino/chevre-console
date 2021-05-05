/**
 * プロジェクトルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as cinerinoapi from '@cinerino/sdk';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';

const projectsRouter = Router();

/**
 * プロジェクト初期化
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get<ParamsDictionary>(
    '/:id/initialize',
    async (req, res, next) => {
        try {
            // プロジェクト作成
            const projectService = new cinerinoapi.service.Project({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient
            });
            const project = await projectService.findById({ id: req.params.id });

            const chevreProjectService = new chevre.service.Project({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: '' }
            });

            await chevreProjectService.create({
                typeOf: chevre.factory.organizationType.Project,
                id: project.id,
                logo: project.logo,
                name: (typeof project.name === 'string') ? project.name : project.name?.ja
            });

            res.redirect(`/projects/${project.id}/home`);
        } catch (err) {
            next(err);
        }
    }
);

export default projectsRouter;
