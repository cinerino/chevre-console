/**
 * カテゴリーコードルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { mvtk } from '@movieticket/reserve-api-abstract-client';
import { Request, Router } from 'express';

import * as Message from '../common/Const/Message';

const categoryCodesRouter = Router();

categoryCodesRouter.get(
    '',
    async (_, res) => {
        res.render('categoryCodes/index', {
            message: '',
            MovieTicketType: mvtk.util.constants.TICKET_TYPE,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            VideoFormatType: chevre.factory.videoFormatType,
            SoundFormatType: chevre.factory.soundFormatType,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
        });
    }
);

categoryCodesRouter.get(
    '/search',
    async (req, res) => {
        try {
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await categoryCodeService.search(<any>{
                limit: limit,
                page: page,
                'project.id': { $eq: req.project.id },
                ...(req.query.inCodeSet !== undefined && req.query.inCodeSet !== null
                    && typeof req.query.inCodeSet.identifier === 'string' && req.query.inCodeSet.identifier.length > 0)
                    ? { 'inCodeSet.identifier': { $eq: req.query.inCodeSet.identifier } }
                    : undefined
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((d) => {
                    return {
                        ...d
                    };
                })
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

categoryCodesRouter.all(
    '/new',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            console.error(errors);
            if (validatorResult.isEmpty()) {
                try {
                    let categoryCode = createMovieFromBody(req);
                    const categoryCodeService = new chevre.service.CategoryCode({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    categoryCode = await categoryCodeService.create(categoryCode);

                    req.flash('message', '登録しました');
                    res.redirect(`/categoryCodes/${(<any>categoryCode).id}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            appliesToCategoryCode: {},
            ...req.body
        };

        res.render('categoryCodes/new', {
            message: message,
            errors: errors,
            forms: forms,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
        });
    }
);

categoryCodesRouter.all(
    '/:id/update',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let categoryCode = await categoryCodeService.findById({
            id: req.params.id
        });

        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    categoryCode = { ...createMovieFromBody(req), ...{ id: (<any>categoryCode).id } };
                    await categoryCodeService.update(categoryCode);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...categoryCode,
            ...req.body
        };

        res.render('categoryCodes/update', {
            message: message,
            errors: errors,
            forms: forms,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
        });
    }
);

function createMovieFromBody(req: Request): chevre.factory.categoryCode.ICategoryCode {
    const body = req.body;

    return {
        typeOf: 'CategoryCode',
        codeValue: body.codeValue,
        inCodeSet: {
            typeOf: 'CategoryCodeSet',
            identifier: body.inCodeSet.identifier
        },
        name: <any>{ ja: body.name.ja },
        ...{
            project: req.project
        }
    };
}

function validate(req: Request): void {
    let colName: string = '';

    colName = '区分分類';
    req.checkBody('inCodeSet.identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '区分コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}

export default categoryCodesRouter;
