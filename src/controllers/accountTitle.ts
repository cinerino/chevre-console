/**
 * 勘定科目コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

const NUM_ADDITIONAL_PROPERTY = 5;

/**
 * 科目分類作成
 */
export async function createAccountTitleCategory(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validateAccountTitleCategory(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const accountTitle = {
                    project: req.project,
                    typeOf: <'AccountTitle'>'AccountTitle',
                    codeValue: req.body.codeValue,
                    name: req.body.name,
                    description: req.body.description,
                    hasCategoryCode: []
                };
                debug('saving account title...', accountTitle);
                const accountTitleService = new chevre.service.AccountTitle({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                await accountTitleService.createAccounTitleCategory(accountTitle);
                req.flash('message', '登録しました');
                res.redirect(`/accountTitles/accountTitleCategory/${accountTitle.codeValue}`);

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

/**
 * 科目分類検索
 */
export async function searchAccountTitleCategory(req: Request, res: Response): Promise<void> {
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

/**
 * 科目分類編集
 */
export async function updateAccountTitleCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        let accountTitle = searchAccountTitlesResult.data.shift();
        if (accountTitle === undefined) {
            throw new chevre.factory.errors.NotFound('AccounTitle');
        }

        if (req.method === 'POST') {
            // バリデーション
            validateAccountTitleCategory(req);
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
                        description: req.body.description
                    };
                    debug('saving account title...', accountTitle);
                    await accountTitleService.updateAccounTitleCategory(accountTitle);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...accountTitle,
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
 * 科目新規登録画面検証
 */
function validateAccountTitleCategory(req: Request): void {
    // 科目分類コード
    let colName: string = '科目分類コード';
    req.checkBody('codeValue', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('codeValue', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目分類名称
    colName = '科目分類名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}

/**
 * 科目追加
 */
export async function addAccountTitleSet(req: Request, res: Response): Promise<void> {
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
        validateAccountTitleSet(req);
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
export async function searchAccountTitleSet(req: Request, res: Response): Promise<void> {
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
export async function updateAccountTitleSet(req: Request, res: Response): Promise<void> {
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
        validateAccountTitleSet(req);
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
function validateAccountTitleSet(req: Request): void {
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

/**
 * 科目分類作成
 */
export async function createAccountTitle(req: Request, res: Response): Promise<void> {
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
        validateAccountTitle(req);
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
export async function updateAccountTitle(req: Request, res: Response): Promise<void> {
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
        validateAccountTitle(req);
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
function validateAccountTitle(req: Request): void {
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
