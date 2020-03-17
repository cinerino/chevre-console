/**
 * 科目分類管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
import * as _ from 'underscore';

import * as Message from '../../message';

const debug = createDebug('chevre-backend:routes');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

const accountTitleCategoryRouter = Router();

accountTitleCategoryRouter.get(
    '',
    async (req, res) => {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.xhr) {
            try {
                debug('searching accountTitleCategories...', req.query);
                const limit = Number(req.query.limit);
                const page = Number(req.query.page);
                const { data } = await accountTitleService.searchAccountTitleCategories({
                    limit: limit,
                    page: page,
                    project: { ids: [req.project.id] },
                    codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '') ? `${req.query.codeValue}` : undefined
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
                    count: 0,
                    results: []
                });
            }
        } else {
            res.render('accountTitles/accountTitleCategory/index', {
                forms: {}
            });
        }
    }
);

accountTitleCategoryRouter.get(
    '/new',
    async (req, res) => {
        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitleCategory = createFromBody(req, true);
                    debug('saving account title...', accountTitleCategory);
                    const accountTitleService = new chevre.service.AccountTitle({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    await accountTitleService.createAccounTitleCategory(accountTitleCategory);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles/accountTitleCategory/${accountTitleCategory.codeValue}`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...req.body
        };

        res.render('accountTitles/accountTitleCategory/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
);

accountTitleCategoryRouter.post(
    '/new',
    async (req, res) => {
        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitleCategory = createFromBody(req, true);
                    debug('saving account title...', accountTitleCategory);
                    const accountTitleService = new chevre.service.AccountTitle({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    await accountTitleService.createAccounTitleCategory(accountTitleCategory);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles/accountTitleCategory/${accountTitleCategory.codeValue}`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...req.body
        };

        res.render('accountTitles/accountTitleCategory/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
);

accountTitleCategoryRouter.get(
    '/:codeValue',
    async (req, res, next) => {
        try {
            let message = '';
            let errors: any = {};

            const accountTitleService = new chevre.service.AccountTitle({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchAccountTitlesResult = await accountTitleService.searchAccountTitleCategories({
                project: { ids: [req.project.id] },
                codeValue: { $eq: req.params.codeValue }
            });
            let accountTitleCategory = searchAccountTitlesResult.data.shift();
            if (accountTitleCategory === undefined) {
                throw new chevre.factory.errors.NotFound('AccounTitle');
            }

            if (req.method === 'POST') {
                // バリデーション
                validate(req);
                const validatorResult = await req.getValidationResult();
                errors = req.validationErrors(true);
                if (validatorResult.isEmpty()) {
                    // 作品DB登録
                    try {
                        accountTitleCategory = createFromBody(req, false);
                        debug('saving account title...', accountTitleCategory);
                        await accountTitleService.updateAccounTitleCategory(accountTitleCategory);
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);

                        return;
                    } catch (error) {
                        message = error.message;
                    }
                }
            }

            const forms = {
                ...accountTitleCategory,
                ...req.body
            };

            res.render('accountTitles/accountTitleCategory/edit', {
                message: message,
                errors: errors,
                forms: forms
            });
        } catch (error) {
            next(error);
        }
    }
);

accountTitleCategoryRouter.post(
    '/:codeValue',
    async (req, res, next) => {
        try {
            let message = '';
            let errors: any = {};

            const accountTitleService = new chevre.service.AccountTitle({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchAccountTitlesResult = await accountTitleService.searchAccountTitleCategories({
                project: { ids: [req.project.id] },
                codeValue: { $eq: req.params.codeValue }
            });
            let accountTitleCategory = searchAccountTitlesResult.data.shift();
            if (accountTitleCategory === undefined) {
                throw new chevre.factory.errors.NotFound('AccounTitle');
            }

            if (req.method === 'POST') {
                // バリデーション
                validate(req);
                const validatorResult = await req.getValidationResult();
                errors = req.validationErrors(true);
                if (validatorResult.isEmpty()) {
                    // 作品DB登録
                    try {
                        accountTitleCategory = createFromBody(req, false);
                        debug('saving account title...', accountTitleCategory);
                        await accountTitleService.updateAccounTitleCategory(accountTitleCategory);
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);

                        return;
                    } catch (error) {
                        message = error.message;
                    }
                }
            }

            const forms = {
                ...accountTitleCategory,
                ...req.body
            };

            res.render('accountTitles/accountTitleCategory/edit', {
                message: message,
                errors: errors,
                forms: forms
            });
        } catch (error) {
            next(error);
        }
    }
);

function createFromBody(req: Request, isNew: boolean): chevre.factory.accountTitle.IAccountTitle {
    return {
        project: req.project,
        typeOf: <'AccountTitle'>'AccountTitle',
        codeValue: req.body.codeValue,
        name: req.body.name,
        // description: req.body.description,
        // inDefinedTermSet: req.body.inDefinedTermSet
        ...(isNew)
            ? { hasCategoryCode: [] }
            : undefined
    };
}

/**
 * 科目分類検証
 */
function validate(req: Request): void {
    let colName: string = 'コード';
    req.checkBody('codeValue')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE));

    colName = '名称';
    req.checkBody('name')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_NAME_JA })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA));
}

export default accountTitleCategoryRouter;
