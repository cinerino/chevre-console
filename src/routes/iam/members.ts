/**
 * IAMメンバールーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status';

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

export default iamMembersRouter;
