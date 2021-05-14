/**
 * IAMユーザールーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { validationResult } from 'express-validator';
import { INTERNAL_SERVER_ERROR } from 'http-status';

// import * as Message from '../../message';

const iamUsersRouter = Router();

iamUsersRouter.get(
    '',
    async (__, res) => {
        res.render('iam/users/index', {
            message: '',
            TaskName: chevre.factory.taskName,
            TaskStatus: chevre.factory.taskStatus
        });
    }
);

iamUsersRouter.get(
    '/search',
    async (req, res) => {
        try {
            const iamService = new chevre.service.IAM({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchConditions: any = {
                // limit: req.query.limit,
                // page: req.query.page,
                username: (req.query.username !== undefined && req.query.username !== '') ? req.query.username : undefined,
                email: (typeof req.query.email === 'string' && req.query.email.length > 0) ? req.query.email : undefined,
                telephone: (req.query.telephone !== undefined && req.query.telephone !== '') ? req.query.telephone : undefined,
                familyName: (req.query.familyName !== undefined && req.query.familyName !== '') ? req.query.familyName : undefined,
                givenName: (req.query.givenName !== undefined && req.query.givenName !== '') ? req.query.givenName : undefined
            };
            const { data } = await iamService.searchUsers(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((m) => {
                    return {
                        ...m
                    };
                })
            });
        } catch (err) {
            res.status((typeof err.code === 'number') ? err.code : INTERNAL_SERVER_ERROR)
                .json({
                    success: false,
                    count: 0,
                    results: []
                });
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
iamUsersRouter.all<ParamsDictionary>(
    '/:id/update',
    // ...validate(),
    async (req, res, next) => {
        let message = '';
        let errors: any = {};

        const iamService = new chevre.service.IAM({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });

        try {
            const user = await iamService.findUserById({ id: req.params.id });

            if (req.method === 'POST') {
                // 検証
                const validatorResult = validationResult(req);
                errors = validatorResult.mapped();

                // 検証
                if (validatorResult.isEmpty()) {
                    try {
                        // 管理者としてプロフィール更新の場合、メールアドレスを認証済にセット
                        const additionalProperty = (Array.isArray(req.body.additionalProperty))
                            ? <chevre.factory.person.IAdditionalProperty>req.body.additionalProperty
                            : [];
                        additionalProperty.push({
                            name: 'email_verified',
                            value: 'true'
                        });
                        const profile = {
                            ...req.body,
                            additionalProperty: additionalProperty
                        };

                        await iamService.updateUserProfile({
                            ...profile,
                            id: req.params.id
                        });
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);

                        return;
                    } catch (error) {
                        message = error.message;
                    }
                }
            }

            const forms = {
                ...user,
                ...req.body
            };

            // if (req.method === 'POST') {
            // } else {
            // }

            res.render('iam/users/update', {
                message: message,
                errors: errors,
                forms: forms
            });
        } catch (error) {
            next(error);
        }
    }
);

export default iamUsersRouter;
