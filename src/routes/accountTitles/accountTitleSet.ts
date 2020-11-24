/**
 * 科目管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import * as _ from 'underscore';

import * as Message from '../../message';

const debug = createDebug('chevre-backend:routes');

const NAME_MAX_LENGTH_CODE: number = 30;
const NAME_MAX_LENGTH_NAME_JA: number = 64;

const accountTitleSetRouter = Router();

accountTitleSetRouter.get(
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
                const { data } = await accountTitleService.searchAccountTitleSets({
                    limit: limit,
                    page: page,
                    project: { ids: [req.project.id] },
                    codeValue: (typeof req.query.codeValue === 'string' && req.query.codeValue.length > 0)
                        ? req.query.codeValue
                        : undefined,
                    inCodeSet: {
                        codeValue: (req.query.inCodeSet.codeValue !== undefined && req.query.inCodeSet.codeValue !== '')
                            ? { $eq: req.query.inCodeSet.codeValue }
                            : undefined
                    },
                    name: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
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
            // 科目分類検索
            const searchAccountTitleCategoriesResult = await accountTitleService.searchAccountTitleCategories({
                limit: 100,
                sort: { codeValue: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] }
            });

            res.render('accountTitles/accountTitleSet/index', {
                forms: {},
                accountTitleCategories: searchAccountTitleCategoriesResult.data
            });
        }

    }
);

accountTitleSetRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitleSet = await createFromBody(req, true);
                    debug('saving account title...', accountTitleSet);
                    await accountTitleService.createAccounTitleSet(accountTitleSet);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles/accountTitleSet/${accountTitleSet.codeValue}`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            inCodeSet: {},
            inDefinedTermSet: {},
            ...req.body
        };

        // 科目分類検索
        const searchAccountTitleCategoriesResult = await accountTitleService.searchAccountTitleCategories({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleCategories = searchAccountTitleCategoriesResult.data;

        res.render('accountTitles/accountTitleSet/add', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleCategories: accountTitleCategories
        });
    }
);

// tslint:disable-next-line:use-default-type-parameter
accountTitleSetRouter.all<ParamsDictionary>(
    '/:codeValue',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
            project: { ids: [req.project.id] },
            codeValue: { $eq: req.params.codeValue }
        });
        let accountTitleSet = searchAccountTitleSetsResult.data.shift();
        if (accountTitleSet === undefined) {
            throw new chevre.factory.errors.NotFound('AccounTitle');
        }
        debug('accountTitle found', accountTitleSet);

        // 科目分類検索
        const searchAccountTitleCategoriesResult = await accountTitleService.searchAccountTitleCategories({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleCategories = searchAccountTitleCategoriesResult.data;

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    accountTitleSet = await createFromBody(req, false);
                    debug('saving account title...', accountTitleSet);
                    await accountTitleService.updateAccounTitleSet(accountTitleSet);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            inCodeSet: {},
            inDefinedTermSet: {},
            ...accountTitleSet,
            ...req.body
        };

        res.render('accountTitles/accountTitleSet/edit', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleCategories: accountTitleCategories
        });
    }
);

async function createFromBody(req: Request, isNew: boolean): Promise<chevre.factory.accountTitle.IAccountTitle> {
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    // 科目分類検索
    const searchAccountTitleCategoriesResult = await accountTitleService.searchAccountTitleCategories({
        limit: 1,
        project: { ids: [req.project.id] },
        codeValue: { $eq: req.body.inCodeSet?.codeValue }
    });
    const accountTitleCategory = searchAccountTitleCategoriesResult.data.shift();
    if (accountTitleCategory === undefined) {
        throw new Error('科目分類が見つかりません');
    }

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: <'AccountTitle'>'AccountTitle',
        codeValue: req.body.codeValue,
        name: req.body.name,
        hasCategoryCode: [],
        inCodeSet: accountTitleCategory,
        // inDefinedTermSet: req.body.inDefinedTermSet
        ...(isNew)
            ? { hasCategoryCode: [] }
            : undefined
    };
}

/**
 * 科目バリデーション
 */
function validate() {
    return [
        body('inCodeSet.codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '科目分類')),

        body('codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLengthHalfByte('コード', NAME_MAX_LENGTH_CODE))
            .matches(/^[0-9a-zA-Z]+$/)
            .withMessage(() => '英数字で入力してください'),

        body('name')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA })
            .withMessage(Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_NAME_JA))
    ];
}

export default accountTitleSetRouter;
