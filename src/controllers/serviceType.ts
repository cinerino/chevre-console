/**
 * 興行区分コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
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

    const forms = req.body;

    // 作品マスタ画面遷移
    res.render('serviceTypes/add', {
        message: message,
        errors: errors,
        forms: forms
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const serviceTypeService = new chevre.service.ServiceType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
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
        ...serviceType,
        ...req.body
    };

    // 作品マスタ画面遷移
    res.render('serviceTypes/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}

function createMovieFromBody(body: any): chevre.factory.serviceType.IServiceType {
    return {
        typeOf: 'ServiceType',
        id: body.id,
        name: body.name
    };
}

/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
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
            count: 0,
            results: []
        });
    }
}

/**
 * 一覧
 */
export async function index(__: Request, res: Response): Promise<void> {
    res.render('serviceTypes/index', {
        filmModel: {}
    });
}

function validate(req: Request, checkType: string): void {
    let colName: string = '';

    // 作品コード
    if (checkType === 'add') {
        colName = '興行区分コード';
        req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }

    colName = '名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}
