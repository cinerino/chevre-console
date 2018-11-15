/**
 * 券種マスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Response } from 'express';
import * as _ from 'underscore';
import * as Message from '../common/Const/Message';

import User from '../user';

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
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchAccountTitlesResult = await accountTitleService.search({});

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
                const ticketType = await ticketTypeService.createTicketType(await createFromBody(req.body, req.user));
                message = '登録完了';
                res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    const forms = {
        name: {},
        description: {},
        alternateName: {},
        priceSpecification: {
            referenceQuantity: {},
            accounting: { operatingRevenue: {} }
        },
        ...req.body
    };

    res.render('ticketType/add', {
        message: message,
        errors: errors,
        forms: forms,
        ItemAvailability: chevre.factory.itemAvailability,
        accountTitles: searchAccountTitlesResult.data
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
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchAccountTitlesResult = await accountTitleService.search({});

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
                    ...await createFromBody(req.body, req.user)
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
        ...ticketType,
        priceSpecification: {
            referenceQuantity: {},
            accounting: {
                operatingRevenue: {}
            },
            ...ticketType.priceSpecification
        },
        ...req.body
    };

    res.render('ticketType/update', {
        message: message,
        errors: errors,
        forms: forms,
        ItemAvailability: chevre.factory.itemAvailability,
        accountTitles: searchAccountTitlesResult.data
    });
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = await ticketTypeService.searchTicketTypes({
            limit: req.query.limit,
            page: req.query.page,
            id: req.query.id,
            name: req.query.name
        });
        res.json({
            success: true,
            count: result.totalCount,
            results: result.data.map((t) => {
                return {
                    ...t,
                    // id: t.id,
                    ticketCode: t.id,
                    managementTypeName: t.name.ja
                    // price: t.price,
                    // availability: t.availability,
                    // eligilbleQuantityValue: t.eligibleQuantity.value
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
    // 券種マスタ画面遷移
    res.render('ticketType/index', {
        message: ''
    });
}

async function createFromBody(body: any, user: User): Promise<chevre.factory.ticketType.ITicketType> {
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const priceSpecificationService = new chevre.service.PriceSpecification({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });

    // ムビチケ券種区分指定であれば、価格仕様が登録されているかどうか確認
    let appliesToMovieTicketType: string | undefined;
    if (body.priceSpecification.appliesToMovieTicketType !== undefined && body.priceSpecification.appliesToMovieTicketType !== '') {
        appliesToMovieTicketType = body.priceSpecification.appliesToMovieTicketType;

        const searchMvtkCompoundSpecsResult = await priceSpecificationService.searchCompoundPriceSpecifications({
            limit: 1,
            typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: { typeOf: chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification }
        });
        if (searchMvtkCompoundSpecsResult.totalCount === 0) {
            throw new Error('ムビチケ券種区分チャージ仕様が見つかりません');
        }
        const mvtkSpecs = searchMvtkCompoundSpecsResult.data[0].priceComponent.filter(
            (spec) => spec.appliesToMovieTicketType === appliesToMovieTicketType
        );
        if (mvtkSpecs.length === 0) {
            throw new Error(`指定されたムビチケ券種区分 ${appliesToMovieTicketType} のチャージ仕様が見つかりません`);
        }
    }

    const operatingRevenue = await accountTitleService.findByIdentifier({
        identifier: body.priceSpecification.accounting.operatingRevenue.identifier
    });
    let nonOperatingRevenue: chevre.factory.accountTitle.IAccountTitle | undefined;
    if (body.accounting !== undefined
        && body.accounting.nonOperatingRevenue !== undefined
        && body.accounting.nonOperatingRevenue.identifier !== undefined
        && body.accounting.nonOperatingRevenue.identifier !== '') {
        nonOperatingRevenue = await accountTitleService.findByIdentifier({
            identifier: body.priceSpecification.accounting.nonOperatingRevenue.identifier
        });
    }
    const referenceQuantity: chevre.factory.quantitativeValue.IQuantitativeValue<chevre.factory.unitCode.C62> = {
        typeOf: 'QuantitativeValue',
        value: Number(body.priceSpecification.referenceQuantity.value),
        unitCode: chevre.factory.unitCode.C62
    };
    const priceSpecification: chevre.factory.ticketType.IPriceSpecification = {
        typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
        price: Number(body.priceSpecification.price),
        priceCurrency: chevre.factory.priceCurrency.JPY,
        valueAddedTaxIncluded: true,
        referenceQuantity: referenceQuantity,
        appliesToMovieTicketType: appliesToMovieTicketType,
        accounting: {
            typeOf: 'Accounting',
            accountsReceivable: Number(body.priceSpecification.accounting.accountsReceivable),
            operatingRevenue: operatingRevenue,
            nonOperatingRevenue: nonOperatingRevenue
        }
    };

    return {
        ...body,
        typeOf: 'Offer',
        priceSpecification: priceSpecification
    };
}

/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req: Request): void {
    // 券種コード
    let colName: string = '券種コード';
    req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.en', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 管理用券種名
    // colName = '管理用券種名';
    // req.checkBody('managementTypeName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody(
    //     'managementTypeName',
    //     Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_JA }
    //     );
    // 金額
    colName = '金額';
    req.checkBody('priceSpecification.price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('priceSpecification.price', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: CHAGE_MAX_LENGTH });

    colName = '在庫';
    req.checkBody('availability', Message.Common.required.replace('$fieldName$', colName)).notEmpty();

    colName = '価格単位';
    req.checkBody('priceSpecification.referenceQuantity.value', Message.Common.required.replace('$fieldName$', colName)).notEmpty();

    colName = '営業収益科目';
    req.checkBody('priceSpecification.accounting.operatingRevenue.identifier', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
}
