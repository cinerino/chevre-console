/**
 * 券種マスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Response } from 'express';
import * as _ from 'underscore';
import * as Message from '../common/Const/Message';

// 1ページに表示するデータ数
// const DEFAULT_LINES = 10;
// 券種コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 券種名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // 検証
        validateFormAdd(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            // 券種DB登録プロセス
            try {
                const ticketType = {
                    id: req.body.ticketCode,
                    name: {
                        ja: req.body.ticketNameJa,
                        en: req.body.ticketNameEn
                    },
                    description: {
                        ja: '',
                        en: ''
                    },
                    notes: {
                        ja: '',
                        en: ''
                    },
                    charge: req.body.ticketCharge
                };
                await ticketTypeService.createTicketType(ticketType);
                message = '登録完了';
                res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        ticketCode: (_.isEmpty(req.body.ticketCode)) ? '' : req.body.ticketCode,
        ticketNameJa: (_.isEmpty(req.body.ticketNameJa)) ? '' : req.body.ticketNameJa,
        ticketNameEn: (_.isEmpty(req.body.ticketNameEn)) ? '' : req.body.ticketNameEn,
        managementTypeName: (_.isEmpty(req.body.managementTypeName)) ? '' : req.body.managementTypeName,
        ticketCharge: (_.isEmpty(req.body.ticketCharge)) ? '' : req.body.ticketCharge,
        descriptionJa: (_.isEmpty(req.body.descriptionJa)) ? '' : req.body.descriptionJa,
        descriptionEn: (_.isEmpty(req.body.descriptionEn)) ? '' : req.body.descriptionEn,
        hiddenColor: (_.isEmpty(req.body.hiddenColor)) ? '' : req.body.hiddenColor
    };
    res.render('ticketType/add', {
        message: message,
        errors: errors,
        forms: forms
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    let ticketType = await ticketTypeService.findTicketTypeById({ id: req.params.id });
    if (req.method === 'POST') {
        // 検証
        validateFormAdd(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            // 券種DB更新プロセス
            try {
                ticketType = {
                    id: req.params.id,
                    name: {
                        ja: req.body.ticketNameJa,
                        en: req.body.ticketNameEn
                    },
                    description: {
                        ja: '',
                        en: ''
                    },
                    notes: {
                        ja: '',
                        en: ''
                    },
                    charge: req.body.ticketCharge
                };
                await ticketTypeService.updateTicketType(ticketType);
                message = '編集完了';
                res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        ticketCode: (_.isEmpty(req.body.ticketCode)) ? ticketType.id : req.body.ticketCode,
        ticketNameJa: (_.isEmpty(req.body.ticketNameJa)) ? ticketType.name.ja : req.body.ticketNameJa,
        ticketNameEn: (_.isEmpty(req.body.ticketNameEn)) ? ticketType.name.en : req.body.ticketNameEn,
        managementTypeName: (_.isEmpty(req.body.managementTypeName)) ? '' : req.body.managementTypeName,
        ticketCharge: (_.isEmpty(req.body.ticketCharge)) ? ticketType.charge : req.body.ticketCharge,
        descriptionJa: (_.isEmpty(req.body.descriptionJa)) ? '' : req.body.descriptionJa,
        descriptionEn: (_.isEmpty(req.body.descriptionEn)) ? '' : req.body.descriptionEn,
        hiddenColor: (_.isEmpty(req.body.hiddenColor)) ? '' : req.body.hiddenColor
    };
    res.render('ticketType/update', {
        message: message,
        errors: errors,
        forms: forms
    });
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    // const limit: number = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : DEFAULT_LINES;
    // const page: number = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
    // const ticketCode: string = (!_.isEmpty(req.query.ticketCode)) ? req.query.ticketCode : null;
    // const managementTypeName: string = (!_.isEmpty(req.query.managementTypeName)) ? req.query.managementTypeName : null;
    // const ticketCharge: string = (!_.isEmpty(req.query.ticketCharge)) ? req.query.ticketCharge : null;

    // const conditions: any = {};
    // if (ticketCode !== null) {
    //     const key: string = '_id';
    //     conditions[key] = ticketCode;
    // }
    // if (managementTypeName !== null) {
    //     conditions['name.ja'] = { $regex: managementTypeName };
    // }
    // if (ticketCharge !== null) {
    //     const key: string = 'charge';
    //     conditions[key] = ticketCharge;
    // }

    try {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const ticketTypes = await ticketTypeService.searchTicketTypes({});
        // const count = await ticketTypeRepo.ticketTypeModel.count(conditions).exec();
        // let results: any[] = [];
        // if (count > 0) {
        //     const ticketTypes = await ticketTypeRepo.ticketTypeModel.find(conditions)
        //         .skip(limit * (page - 1))
        //         .limit(limit)
        //         .exec();
        //     results = ticketTypes.map((ticketType) => {
        //         return {
        //             id: ticketType._id,
        //             ticketCode: ticketType._id,
        //             managementTypeName: ticketType.get('name').ja,
        //             ticketCharge: ticketType.get('charge')
        //         };
        //     });
        // }

        res.json({
            success: true,
            count: ticketTypes.length,
            results: ticketTypes.map((t) => {
                return {
                    id: t.id,
                    ticketCode: t.id,
                    managementTypeName: t.name.ja,
                    ticketCharge: t.charge
                };
            })
        });
    } catch (err) {
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
    // 券種グループマスタ画面遷移
    res.render('ticketType/index', {
        message: ''
    });
}

/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req: Request): void {
    // 券種コード
    let colName: string = '券種コード';
    req.checkBody('ticketCode', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketCode', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('ticketNameJa', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketNameJa', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('ticketNameEn', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketNameEn', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 管理用券種名
    // colName = '管理用券種名';
    // req.checkBody('managementTypeName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody(
    //     'managementTypeName',
    //     Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_JA }
    //     );
    // 金額
    colName = '金額';
    req.checkBody('ticketCharge', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('ticketCharge', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: CHAGE_MAX_LENGTH });
}
