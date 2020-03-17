/**
 * 勘定科目管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Router } from 'express';
import * as _ from 'underscore';

import * as Message from '../message';

const debug = createDebug('chevre-backend:routes');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

const NUM_ADDITIONAL_PROPERTY = 5;

import accountTitleCategoryRouter from './accountTitles/accountTitleCategory';
import accountTitleSetRouter from './accountTitles/accountTitleSet';

const accountTitlesRouter = Router();

accountTitlesRouter.use('/accountTitleCategory', accountTitleCategoryRouter);
accountTitlesRouter.use('/accountTitleSet', accountTitleSetRouter);

accountTitlesRouter.get(
    '',
    async (req, res) => {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        // 科目分類検索
        const searchAccountTitleCategoriesResult = await accountTitleService.searchAccountTitleCategories({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });

        // 科目検索
        const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });

        res.render('accountTitles/index', {
            forms: {},
            accountTitleCategories: searchAccountTitleCategoriesResult.data,
            accountTitleSets: searchAccountTitleSetsResult.data.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
        });
    }
);

accountTitlesRouter.get(
    '/getlist',
    async (req, res) => {
        try {
            const accountTitleService = new chevre.service.AccountTitle({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            debug('searching...', req.query);
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await accountTitleService.search({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '')
                    ? { $eq: req.query.codeValue }
                    : undefined,
                inCodeSet: {
                    codeValue: (req.query.inCodeSet.codeValue !== undefined && req.query.inCodeSet.codeValue !== '')
                        ? { $eq: req.query.inCodeSet.codeValue }
                        : undefined,
                    inCodeSet: {
                        codeValue: (req.query.inCodeSet.inCodeSet.codeValue !== undefined && req.query.inCodeSet.inCodeSet.codeValue !== '')
                            ? { $eq: req.query.inCodeSet.inCodeSet.codeValue }
                            : undefined
                    }
                }
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
    }
);

accountTitlesRouter.all(
    '/new',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const accountTitle = await createFromBody(req);
                    debug('saving account title...', accountTitle);
                    await accountTitleService.create(accountTitle);
                    req.flash('message', '登録しました');
                    res.redirect(`/accountTitles/${accountTitle.codeValue}`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            additionalProperty: [],
            inCodeSet: {},
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // 科目分類検索
        const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleSets = searchAccountTitleSetsResult.data;

        res.render('accountTitles/new', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleSets: accountTitleSets.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
        });
    }
);

accountTitlesRouter.all(
    '/:codeValue',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchAccountTitlesResult = await accountTitleService.search({
            project: { ids: [req.project.id] },
            codeValue: { $eq: req.params.codeValue }
        });
        let accountTitle = searchAccountTitlesResult.data.shift();
        if (accountTitle === undefined) {
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
                    accountTitle = await createFromBody(req);
                    debug('saving account title...', accountTitle);
                    await accountTitleService.update(accountTitle);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        // 科目分類検索
        const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        const accountTitleSets = searchAccountTitleSetsResult.data;

        const forms = {
            additionalProperty: [],
            ...accountTitle,
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        res.render('accountTitles/edit', {
            message: message,
            errors: errors,
            forms: forms,
            accountTitleSets: accountTitleSets.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
        });
    }
);

async function createFromBody(req: Request): Promise<chevre.factory.accountTitle.IAccountTitle> {
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    // 科目検索
    const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
        limit: 1,
        project: { ids: [req.project.id] },
        codeValue: { $eq: req.body.inCodeSet?.codeValue }
    });
    const accountTitleSet = searchAccountTitleSetsResult.data.shift();
    if (accountTitleSet === undefined) {
        throw new Error('科目が見つかりません');
    }

    return {
        project: req.project,
        typeOf: <'AccountTitle'>'AccountTitle',
        codeValue: req.body.codeValue,
        name: req.body.name,
        inCodeSet: accountTitleSet,
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined
    };
}

/**
 * 細目バリデーション
 */
function validate(req: Request): void {
    let colName: string = '科目';
    req.checkBody('inCodeSet.codeValue')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));

    colName = 'コード';
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

export default accountTitlesRouter;
