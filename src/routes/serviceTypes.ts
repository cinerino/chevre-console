/**
 * 興行区分ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';

import * as Message from '../common/Const/Message';

const debug = createDebug('chevre-backend:router');

const NUM_ADDITIONAL_PROPERTY = 10;

const serviceTypesRouter = Router();

serviceTypesRouter.all(
    '/add',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'add');
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = '';
                    let serviceType = createFromBody(req);
                    debug('saving an serviceType...', serviceType);

                    const categoryCodeService = new chevre.service.CategoryCode({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    serviceType = await categoryCodeService.create(serviceType);

                    req.flash('message', '登録しました');
                    res.redirect(`/serviceTypes/${serviceType.id}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            additionalProperty: [],
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        res.render('serviceTypes/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
);

serviceTypesRouter.get(
    '',
    (_, res) => {
        res.render('serviceTypes/index', {
            message: ''
        });
    }
);

serviceTypesRouter.get(
    '/getlist',
    async (req, res) => {
        try {
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await categoryCodeService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } },
                codeValue: {
                    $eq: (req.query.codeValue !== undefined && req.query.codeValue !== '') ? req.query.codeValue : undefined
                },
                name: req.query.name
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data
            });
        } catch (error) {
            res.json({
                success: false,
                message: error.message,
                count: 0,
                results: []
            });
        }
    }
);

serviceTypesRouter.all(
    '/:id/update',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let serviceType = await categoryCodeService.findById({
            id: req.params.id
        });

        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'update');
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = req.params.id;
                    serviceType = createFromBody(req);
                    debug('saving an serviceType...', serviceType);
                    await categoryCodeService.update(serviceType);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            additionalProperty: [],
            ...serviceType,
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        res.render('serviceTypes/edit', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
);

export default serviceTypesRouter;

function createFromBody(req: Request): chevre.factory.serviceType.IServiceType {
    const body = req.body;

    return {
        project: req.project,
        typeOf: 'CategoryCode',
        id: body.id,
        codeValue: body.codeValue,
        inCodeSet: {
            typeOf: 'CategoryCodeSet',
            identifier: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType
        },
        name: body.name,
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined
    };
}

const NAME_MAX_LENGTH_CODE: number = 64;
const NAME_MAX_LENGTH_NAME_JA: number = 64;

function validate(req: Request, checkType: string): void {
    let colName: string = '';

    if (checkType === 'add') {
        colName = 'コード';
        req.checkBody('codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', colName))
            .matches(/^[0-9a-zA-Z\+]+$/)
            .len({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));
    }

    colName = '名称';
    req.checkBody('name.ja')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_NAME_JA })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));
}
