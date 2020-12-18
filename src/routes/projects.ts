/**
 * プロジェクトルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as cinerinoapi from '@cinerino/sdk';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

const DEFAULT_EMAIL_SENDER = process.env.DEFAULT_EMAIL_SENDER;

const projectsRouter = Router();

/**
 * プロジェクト初期化
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get<ParamsDictionary>(
    '/initialize',
    async (req, res, next) => {
        try {
            // プロジェクト作成
            const projectService = new cinerinoapi.service.Project({
                endpoint: <string>process.env.CINERINO_API_ENDPOINT,
                auth: req.user.authClient
            });
            const project = await projectService.findById({ id: req.project.id });

            const chevreProjectService = new chevre.service.Project({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            await chevreProjectService.create({
                typeOf: chevre.factory.organizationType.Project,
                id: project.id,
                logo: project.logo,
                name: (typeof project.name === 'string') ? project.name : project.name?.ja
            });

            res.redirect('/home');
        } catch (err) {
            next(err);
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get<ParamsDictionary>(
    '/settings',
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

projectsRouter.post(
    '/createReservationReport',
    async (req, res, next) => {
        try {
            let eventStartFrom: Date | undefined;
            let eventStartThrough: Date | undefined;

            eventStartFrom = moment()
                .tz('Asia/Tokyo')
                .add(-1, 'month')
                .startOf('month')
                .toDate();
            eventStartThrough = moment()
                .tz('Asia/Tokyo')
                .add(-1, 'month')
                .endOf('month')
                .toDate();

            const startDay = moment(eventStartFrom)
                .tz('Asia/Tokyo')
                .format('YYYYMMDD');
            const endDay = moment(eventStartThrough)
                .tz('Asia/Tokyo')
                .format('YYYYMMDD');
            const reportName = `ReservationReport[${startDay}-${endDay}]`;
            const expires = moment()
                .add(1, 'day')
                .toDate();
            const recipientEmail = (typeof req.body.recipientEmail === 'string' && req.body.recipientEmail.length > 0)
                ? req.body.recipientEmail
                : req.user.profile.email;

            const taskService = new chevre.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const task = await taskService.create({
                name: <any>'createReservationReport',
                project: { typeOf: req.project.typeOf, id: req.project.id },
                runsAt: new Date(),
                data: {
                    typeOf: 'CreateAction',
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    agent: {
                        typeOf: cinerinoapi.factory.personType.Person,
                        id: req.user.profile.sub,
                        familyName: req.user.profile.family_name,
                        givenName: req.user.profile.given_name,
                        name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                    },
                    // recipient: { name: 'recipientName' },
                    object: {
                        typeOf: 'Report',
                        about: reportName,
                        mentions: {
                            typeOf: 'SearchAction',
                            query: {
                                reservationFor: {
                                    ...(eventStartFrom instanceof Date) ? { startFrom: eventStartFrom } : undefined,
                                    ...(eventStartThrough instanceof Date) ? { startThrough: eventStartThrough } : undefined
                                }
                            },
                            object: {
                                typeOf: 'Reservation'
                            }
                        },
                        encodingFormat: 'text/csv',
                        expires: expires
                    },
                    potentialActions: {
                        sendEmailMessage: [
                            {
                                object: {
                                    about: `レポートが使用可能です [${req.project.id}]`,
                                    sender: {
                                        name: `Chevre Report [${req.project.id}]`,
                                        email: (typeof DEFAULT_EMAIL_SENDER === 'string' && DEFAULT_EMAIL_SENDER.length > 0)
                                            ? DEFAULT_EMAIL_SENDER
                                            : 'noreply@example.com'
                                    },
                                    toRecipient: { email: recipientEmail }
                                }
                            }
                        ]
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
