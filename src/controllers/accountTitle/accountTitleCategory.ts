/**
 * 科目分類コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../../message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

/**
 * 科目分類作成
 */
export async function create(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
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
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
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
 * 科目分類検証
 */
function validate(req: Request): void {
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
