/**
 * 細目コントローラー
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

const NUM_ADDITIONAL_PROPERTY = 5;

/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
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

/**
 * 一覧
 */
export async function index(req: Request, res: Response): Promise<void> {
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
    debug(searchAccountTitleCategoriesResult);

    // 科目検索
    const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    debug(searchAccountTitleSetsResult);

    res.render('accountTitles/index', {
        forms: {},
        accountTitleCategories: searchAccountTitleCategoriesResult.data,
        accountTitleSets: searchAccountTitleSetsResult.data.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
    });
}

/**
 * 細目作成
 */
export async function create(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};

    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    // 科目分類検索
    const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    const accountTitleSets = searchAccountTitleSetsResult.data;

    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const accountTitleSet = accountTitleSets.find((a) => a.codeValue === req.body.inCodeSet.codeValue);
                const accountTitle = {
                    project: req.project,
                    typeOf: <'AccountTitle'>'AccountTitle',
                    codeValue: req.body.codeValue,
                    name: req.body.name,
                    description: req.body.description,
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

    res.render('accountTitles/new', {
        message: message,
        errors: errors,
        forms: forms,
        accountTitleSets: accountTitleSets.sort((a, b) => Number(a.codeValue) - Number(b.codeValue))
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
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

    // 科目分類検索
    const searchAccountTitleSetsResult = await accountTitleService.searchAccountTitleSets({
        limit: 100,
        sort: { codeValue: chevre.factory.sortType.Ascending },
        project: { ids: [req.project.id] }
    });
    const accountTitleSets = searchAccountTitleSetsResult.data;

    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                accountTitle = {
                    project: req.project,
                    typeOf: <'AccountTitle'>'AccountTitle',
                    codeValue: req.body.codeValue,
                    name: req.body.name,
                    description: req.body.description,
                    inCodeSet: accountTitle.inCodeSet,
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

/**
 * 細目バリデーション
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
