/**
 * 券種マスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

const NUM_ADDITIONAL_PROPERTY = 10;

// 券種コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 券種名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;

const ticketTypeCategories = [
    { id: '1', name: '有料券' },
    { id: '2', name: '前売券' },
    { id: '3', name: '無料券' }
];

/**
 * 新規登録
 */
// tslint:disable-next-line:cyclomatic-complexity
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
                const ticketType = createFromBody(req.body);
                await ticketTypeService.createTicketType(ticketType);
                req.flash('message', '登録しました');
                res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    const forms = {
        additionalProperty: [],
        name: {},
        alternateName: {},
        description: {},
        priceSpecification: {
            referenceQuantity: {
                value: 1
            },
            accounting: {}
        },
        isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? '' : req.body.isBoxTicket,
        isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? '' : req.body.isOnlineTicket,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit,
        ...req.body
    };
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }

    res.render('ticketType/add', {
        message: message,
        errors: errors,
        forms: forms,
        ticketTypeCategories: ticketTypeCategories,
        accountTitles: searchAccountTitlesResult.data
    });
}

/**
 * 編集
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
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
                ticketType = createFromBody(req.body);
                await ticketTypeService.updateTicketType(ticketType);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    if (ticketType.priceSpecification === undefined) {
        throw new Error('ticketType.priceSpecification undefined');
    }

    let isBoxTicket = false;
    let isOnlineTicket = false;
    switch (ticketType.availability) {
        case chevre.factory.itemAvailability.InStock:
            isBoxTicket = true;
            isOnlineTicket = true;
            break;
        case chevre.factory.itemAvailability.InStoreOnly:
            isBoxTicket = true;
            break;
        case chevre.factory.itemAvailability.OnlineOnly:
            isOnlineTicket = true;
            break;
        default:
    }

    let seatReservationUnit = 1;
    if (ticketType.priceSpecification.referenceQuantity.value !== undefined) {
        seatReservationUnit = ticketType.priceSpecification.referenceQuantity.value;
    }

    const accountsReceivable = (ticketType.priceSpecification.accounting !== undefined)
        ? ticketType.priceSpecification.accounting.accountsReceivable
        : '';

    const forms = {
        additionalProperty: [],
        alternateName: {},
        priceSpecification: {
            referenceQuantity: {}
        },
        ...ticketType,
        category: (ticketType.category !== undefined) ? ticketType.category.id : '',
        price: Math.floor(Number(ticketType.priceSpecification.price) / seatReservationUnit),
        accountsReceivable: Math.floor(Number(accountsReceivable) / seatReservationUnit),
        ...req.body,
        isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket,
        isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit,
        accountTitle: (_.isEmpty(req.body.accountTitle))
            ? (ticketType.priceSpecification.accounting !== undefined)
                ? ticketType.priceSpecification.accounting.operatingRevenue.codeValue : undefined
            : req.body.accountTitle,
        nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject))
            ? (ticketType.priceSpecification.accounting !== undefined
                && ticketType.priceSpecification.accounting.nonOperatingRevenue !== undefined)
                ? ticketType.priceSpecification.accounting.nonOperatingRevenue.codeValue : undefined
            : req.body.nonBoxOfficeSubject
    };
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }

    res.render('ticketType/update', {
        message: message,
        errors: errors,
        forms: forms,
        ticketTypeCategories: ticketTypeCategories,
        accountTitles: searchAccountTitlesResult.data
    });
}

// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(body: any): chevre.factory.ticketType.ITicketType {
    let availability: chevre.factory.itemAvailability = chevre.factory.itemAvailability.OutOfStock;
    if (body.isBoxTicket === '1' && body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.InStock;
    } else if (body.isBoxTicket === '1') {
        availability = chevre.factory.itemAvailability.InStoreOnly;
    } else if (body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.OnlineOnly;
    }

    const referenceQuantityValue: number = Number(body.seatReservationUnit);
    const referenceQuantity: chevre.factory.quantitativeValue.IQuantitativeValue<chevre.factory.unitCode.C62> = {
        typeOf: <'QuantitativeValue'>'QuantitativeValue',
        value: referenceQuantityValue,
        unitCode: chevre.factory.unitCode.C62
    };

    const eligibleQuantityMinValue: number | undefined = (body.priceSpecification !== undefined
        && body.priceSpecification.eligibleQuantity !== undefined
        && body.priceSpecification.eligibleQuantity.minValue !== undefined
        && body.priceSpecification.eligibleQuantity.minValue !== '')
        ? Number(body.priceSpecification.eligibleQuantity.minValue)
        : undefined;
    const eligibleQuantityMaxValue: number | undefined = (body.priceSpecification !== undefined
        && body.priceSpecification.eligibleQuantity !== undefined
        && body.priceSpecification.eligibleQuantity.maxValue !== undefined
        && body.priceSpecification.eligibleQuantity.maxValue !== '')
        ? Number(body.priceSpecification.eligibleQuantity.maxValue)
        : undefined;
    const eligibleQuantity: chevre.factory.quantitativeValue.IQuantitativeValue<chevre.factory.unitCode.C62> | undefined =
        (eligibleQuantityMinValue !== undefined || eligibleQuantityMaxValue !== undefined)
            ? {
                typeOf: <'QuantitativeValue'>'QuantitativeValue',
                minValue: eligibleQuantityMinValue,
                maxValue: eligibleQuantityMaxValue,
                unitCode: chevre.factory.unitCode.C62
            }
            : undefined;

    const eligibleTransactionVolumePrice: number | undefined = (body.priceSpecification !== undefined
        && body.priceSpecification.eligibleTransactionVolume !== undefined
        && body.priceSpecification.eligibleTransactionVolume.price !== undefined
        && body.priceSpecification.eligibleTransactionVolume.price !== '')
        ? Number(body.priceSpecification.eligibleTransactionVolume.price)
        : undefined;
    // tslint:disable-next-line:max-line-length
    const eligibleTransactionVolume: chevre.factory.priceSpecification.IPriceSpecification<chevre.factory.priceSpecificationType> | undefined =
        (eligibleTransactionVolumePrice !== undefined)
            ? {
                typeOf: chevre.factory.priceSpecificationType.PriceSpecification,
                price: eligibleTransactionVolumePrice,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true
            }
            : undefined;

    const appliesToMovieTicketType =
        (typeof body.appliesToMovieTicketType === 'string' && (<string>body.appliesToMovieTicketType).length > 0)
            ? <string>body.appliesToMovieTicketType
            : undefined;

    return {
        typeOf: <chevre.factory.offerType>'Offer',
        priceCurrency: chevre.factory.priceCurrency.JPY,
        id: body.id,
        name: body.name,
        description: body.description,
        alternateName: { ja: <string>body.alternateName.ja, en: '' },
        availability: availability,
        priceSpecification: {
            typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
            price: Number(body.price) * referenceQuantityValue,
            priceCurrency: chevre.factory.priceCurrency.JPY,
            valueAddedTaxIncluded: true,
            eligibleQuantity: eligibleQuantity,
            eligibleTransactionVolume: eligibleTransactionVolume,
            referenceQuantity: referenceQuantity,
            appliesToMovieTicketType: appliesToMovieTicketType,
            accounting: {
                typeOf: 'Accounting',
                operatingRevenue: <any>{
                    typeOf: 'AccountTitle',
                    codeValue: body.accountTitle,
                    identifier: body.accountTitle,
                    name: ''
                },
                nonOperatingRevenue: {
                    typeOf: 'AccountTitle',
                    codeValue: body.nonBoxOfficeSubject,
                    identifier: body.nonBoxOfficeSubject,
                    name: ''
                },
                accountsReceivable: Number(body.accountsReceivable) * referenceQuantityValue
            }
        },
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        category: {
            id: <string>body.category
        },
        color: <string>body.indicatorColor
    };
}

export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        // 券種グループ取得
        let ticketTypeIds: string[] = [];
        if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
            const ticketTypeGroup = await ticketTypeService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
            if (ticketTypeGroup.ticketTypes !== null) {
                ticketTypeIds = ticketTypeGroup.ticketTypes;
            } else {
                //券種がありません。
                res.json({
                    success: true,
                    count: 0,
                    results: []
                });
            }
            if (req.query.id !== '' && req.query.id !== undefined) {
                if (ticketTypeIds.indexOf(req.query.id) >= 0) {
                    ticketTypeIds.push(req.query.id);
                }
            }
        } else {
            if (req.query.id !== '' && req.query.id !== undefined) {
                ticketTypeIds.push(req.query.id);
            }
        }

        const result = await ticketTypeService.searchTicketTypes({
            limit: req.query.limit,
            page: req.query.page,
            ids: ticketTypeIds,
            name: req.query.name
        });

        res.json({
            success: true,
            count: result.totalCount,
            results: result.data.map((t) => {
                const category = ticketTypeCategories.find((c) => t.category !== undefined && c.id === t.category.id);

                return {
                    ...t,
                    eligibleQuantity: {
                        minValue: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleQuantity !== undefined
                            && t.priceSpecification.eligibleQuantity.minValue !== undefined)
                            ? t.priceSpecification.eligibleQuantity.minValue
                            : '--',
                        maxValue: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleQuantity !== undefined
                            && t.priceSpecification.eligibleQuantity.maxValue !== undefined)
                            ? t.priceSpecification.eligibleQuantity.maxValue
                            : '--'
                    },
                    eligibleTransactionVolume: {
                        price: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleTransactionVolume !== undefined
                            && t.priceSpecification.eligibleTransactionVolume.price !== undefined)
                            ? t.priceSpecification.eligibleTransactionVolume.price
                            : '--',
                        priceCurrency: (t.priceSpecification !== undefined
                            && t.priceSpecification.eligibleTransactionVolume !== undefined)
                            ? t.priceSpecification.eligibleTransactionVolume.priceCurrency
                            : '--'
                    },
                    referenceQuantity: {
                        value: (t.priceSpecification !== undefined && t.priceSpecification.referenceQuantity.value !== undefined)
                            ? t.priceSpecification.referenceQuantity.value
                            : '--'
                    },
                    categoryName: (category !== undefined) ? category.name : '--'
                };
            })
        });
    } catch (err) {
        res.json({
            success: false,
            message: err.message,
            count: 0,
            results: []
        });
    }
}

/**
 * 関連券種グループリスト
 */
export async function getTicketTypeGroupList(req: Request, res: Response): Promise<void> {
    try {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = await ticketTypeService.searchTicketTypeGroups({
            limit: 100,
            ticketTypes: [req.params.ticketTypeId]
        });

        res.json({
            success: true,
            count: totalCount,
            results: data
        });
    } catch (err) {
        res.json({
            success: false,
            message: err.message,
            count: 0,
            results: []
        });
    }
}

/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req: Request): void {
    // 券種コード
    let colName: string = '券種コード';
    req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('id', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .isAlphanumeric().len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.en', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });

    colName = '代替名称';
    req.checkBody('alternateName.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('alternateName.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });

    // 購入席単位追加
    colName = '購入席単位追加';
    req.checkBody('seatReservationUnit', Message.Common.required.replace('$fieldName$', colName)).notEmpty();

    colName = '発生金額';
    req.checkBody('price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('price', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });

    colName = '売上金額';
    req.checkBody('accountsReceivable', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('accountsReceivable', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });

    colName = '細目';
    req.checkBody('accountTitle', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
