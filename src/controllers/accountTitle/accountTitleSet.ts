/**
 * 科目コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../../message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

/**
 * 科目追加
 */
export async function create(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};

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
    const accountTitleCategories = searchAccountTitleCategoriesResult.data;

    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const accountTitleCategory = accountTitleCategories.find((a) => a.codeValue === req.body.inCodeSet.codeValue);
                const accountTitle = {
                    project: req.project,
                    typeOf: <'AccountTitle'>'AccountTitle',
                    codeValue: req.body.codeValue,
                    name: req.body.name,
                    description: req.body.description,
                    hasCategoryCode: [],
                    inCodeSet: accountTitleCategory,
                    inDefinedTermSet: req.body.inDefinedTermSet
                };
                debug('saving account title...', accountTitle);
                await accountTitleService.createAccounTitleSet(accountTitle);
                req.flash('message', '登録しました');
                res.redirect(`/accountTitles/accountTitleSet/${accountTitle.codeValue}`);

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

    res.render('accountTitles/accountTitleSet/add', {
        message: message,
        errors: errors,
        forms: forms,
        accountTitleCategories: accountTitleCategories
    });
}

/**
 * 科目検索
 */
export async function search(req: Request, res: Response): Promise<void> {
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
                codeValue: (req.query.codeValue !== undefined && req.query.codeValue !== '') ? { $eq: req.query.codeValue } : undefined,
                inCodeSet: {
                    codeValue: (req.query.inCodeSet.codeValue !== undefined && req.query.inCodeSet.codeValue !== '')
                        ? { $eq: req.query.inCodeSet.codeValue }
                        : undefined
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
    } else {
        // 科目分類検索
        const searchAccountTitleCategoriesResult = await accountTitleService.searchAccountTitleCategories({
            limit: 100,
            sort: { codeValue: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] }
        });
        debug(searchAccountTitleCategoriesResult);

        res.render('accountTitles/accountTitleSet/index', {
            forms: {},
            accountTitleCategories: searchAccountTitleCategoriesResult.data
        });
    }

}

/**
 * 科目編集
 */
export async function update(req: Request, res: Response): Promise<void> {
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
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                accountTitleSet = {
                    project: req.project,
                    typeOf: <'AccountTitle'>'AccountTitle',
                    codeValue: req.body.codeValue,
                    name: req.body.name,
                    inCodeSet: {
                        project: req.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.inCodeSet?.codeValue
                    }
                    // inDefinedTermSet: req.body.inDefinedTermSet
                };
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

/**
 * 科目バリデーション
 */
function validate(req: Request): void {
    let colName: string = '科目分類';
    req.checkBody('inCodeSet.codeValue', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();

    colName = '科目コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('codeValue', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });

    colName = '科目名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
