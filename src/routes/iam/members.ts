/**
 * IAMメンバールーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { INTERNAL_SERVER_ERROR } from 'http-status';

import * as Message from '../../message';

const iamMembersRouter = Router();

iamMembersRouter.get(
    '',
    async (__, res) => {
        res.render('iam/members/index', {
            message: '',
            TaskName: chevre.factory.taskName,
            TaskStatus: chevre.factory.taskStatus
        });
    }
);

iamMembersRouter.get(
    '/search',
    async (req, res) => {
        try {
            const iamService = new chevre.service.IAM({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchConditions: any = {
                limit: req.query.limit,
                page: req.query.page,
                member: {
                    typeOf: {
                        $eq: (typeof req.query.member?.typeOf?.$eq === 'string' && req.query.member.typeOf.$eq.length > 0)
                            ? req.query.member.typeOf.$eq
                            : undefined
                    }
                }
            };
            const { data } = await iamService.searchMembers(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
                results: data.map((m) => {
                    return {
                        ...m,
                        rolesStr: m.member.hasRole
                            .map((r) => `<span class="badge badge-light">${r.roleName}</span>`)
                            .join(' ')
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
iamMembersRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    async (req, res, next) => {
        let message = '';
        let errors: any = {};

        const iamService = new chevre.service.IAM({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });

        try {
            let member = await iamService.findMemberById({ member: { id: req.params.id } });

            if (req.method === 'POST') {
                // 検証
                const validatorResult = validationResult(req);
                errors = validatorResult.mapped();

                // 検証
                if (validatorResult.isEmpty()) {
                    try {
                        member = await createFromBody(req, false);
                        await iamService.updateMember({
                            member: {
                                id: req.params.id,
                                hasRole: member.member.hasRole,
                                ...(typeof member.member.name === 'string') ? { name: member.member.name } : undefined
                            }
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
                roleNames: [],
                ...member,
                ...req.body
            };

            if (req.method === 'POST') {
                // 対応決済方法を補完
                // if (Array.isArray(req.body.paymentAccepted) && req.body.paymentAccepted.length > 0) {
                //     forms.paymentAccepted = (<string[]>req.body.paymentAccepted).map((v) => JSON.parse(v));
                // } else {
                //     forms.paymentAccepted = [];
                // }
            } else {
                if (Array.isArray(member.member.hasRole) && member.member.hasRole.length > 0) {
                    forms.roleNames = member.member.hasRole.map((r) => {
                        return r.roleName;
                    });
                } else {
                    forms.roleNames = [];
                }
            }

            const searchRolesResult = await iamService.searchRoles({ limit: 100 });

            res.render('iam/members/update', {
                message: message,
                errors: errors,
                forms: forms,
                roles: searchRolesResult.data
            });
        } catch (error) {
            next(error);
        }
    }
);

function createFromBody(
    req: Request, __: boolean
): any {
    const hasRole = (Array.isArray(req.body.roleName))
        ? (<any[]>req.body.roleName)
            .filter((r) => typeof r === 'string' && r.length > 0)
            .map((r) => {
                return {
                    roleName: String(r)
                };
            })
        : [];

    return {
        member: {
            applicationCategory: (req.body.member !== undefined && req.body.member !== null)
                ? req.body.member.applicationCategory : '',
            typeOf: (req.body.member !== undefined && req.body.member !== null)
                ? req.body.member.typeOf : '',
            id: (req.body.member !== undefined && req.body.member !== null)
                ? req.body.member.id : '',
            hasRole: hasRole,
            ...(typeof req.body.member?.name === 'string') ? { name: req.body.member?.name } : undefined
        }
    };
}

function validate() {
    return [
        body('member.typeOf')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'メンバータイプ'))

        // body(['name.ja', 'name.en'])
        //     .notEmpty()
        //     .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
        //     .isLength({ max: NAME_MAX_LENGTH_NAME })
        //     .withMessage(Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_NAME))
    ];
}

export default iamMembersRouter;
