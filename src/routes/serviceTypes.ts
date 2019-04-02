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
                    const serviceType = createMovieFromBody(req.body);
                    debug('saving an serviceType...', serviceType);
                    const serviceTypeService = new chevre.service.ServiceType({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    await serviceTypeService.create(serviceType);

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
            const serviceTypeService = new chevre.service.ServiceType({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const result = await serviceTypeService.search({
                limit: req.query.limit,
                page: req.query.page,
                ids: (req.query.id !== undefined && req.query.id !== '') ? [req.query.id] : undefined,
                name: req.query.name
            });

            res.json({
                success: true,
                count: result.totalCount,
                results: result.data
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

        const serviceTypeService = new chevre.service.ServiceType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let serviceType = await serviceTypeService.findById({
            id: req.params.id
        });

        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'update');
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    serviceType = createMovieFromBody(req.body);
                    debug('saving an serviceType...', serviceType);
                    await serviceTypeService.update(serviceType);
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

function createMovieFromBody(body: any): chevre.factory.serviceType.IServiceType {
    return {
        typeOf: 'ServiceType',
        id: body.id,
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
        colName = '興行区分コード';
        req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }

    colName = '名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}
