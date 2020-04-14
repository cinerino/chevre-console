/**
 * プロジェクトルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

const projectsRouter = Router();

// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get<ParamsDictionary>(
    '/settings',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const message = '';
            const errors: any = {};

            const projectService = new chevre.service.Project({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const project = await projectService.findById({ id: req.project.id });

            const forms = {
                ...project
            };

            res.render('projects/settings', {
                message: message,
                errors: errors,
                forms: forms
            });
        } catch (err) {
            next(err);
        }
    }
);

projectsRouter.post(
    '/aggregate',
    async (req, res, next) => {
        try {
            const taskService = new chevre.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const task = await taskService.create({
                name: <any>'aggregateOnProject',
                project: { typeOf: req.project.typeOf, id: req.project.id },
                runsAt: new Date(),
                data: {
                    project: { id: req.project.id },
                    reservationFor: {
                        startFrom: moment()
                            .tz('Asia/Tokyo')
                            .startOf('month')
                            .toDate(),
                        startThrough: moment()
                            .tz('Asia/Tokyo')
                            .endOf('month')
                            .toDate()
                    }
                },
                status: chevre.factory.taskStatus.Ready,
                numberOfTried: 0,
                remainingNumberOfTries: 3,
                executionResults: []
            });

            res.json(task);
        } catch (err) {
            next(err);
        }
    }
);

export default projectsRouter;
