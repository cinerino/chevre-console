/**
 * オファー管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../message';

import { ProductType, productTypes } from '../factory/productType';

const NUM_ADDITIONAL_PROPERTY = 10;

// コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;

const offersRouter = Router();

offersRouter.all(
    '/add',
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // 検証
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 登録プロセス
                try {
                    req.body.id = '';
                    let offer = await createFromBody(req, true);

                    // コード重複確認
                    const { data } = await offerService.searchTicketTypes({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        identifier: { $eq: offer.identifier }
                    });
                    if (data.length > 0) {
                        throw new Error(`既に存在するコードです: ${offer.identifier}`);
                    }

                    // コード重複確認
                    const searchOffersResult = await offerService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        identifier: { $eq: offer.identifier }
                    });
                    if (searchOffersResult.data.length > 0) {
                        throw new Error(`既に存在するコードです: ${offer.identifier}`);
                    }

                    offer = await offerService.create(offer);
                    req.flash('message', '登録しました');
                    res.redirect(`/offers/${offer.id}/update`);

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
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        const searchOfferCategoryTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });

        const searchAccountTitlesResult = await accountTitleService.search({
            project: { ids: [req.project.id] }
        });

        res.render('offers/add', {
            message: message,
            errors: errors,
            forms: forms,
            ticketTypeCategories: searchOfferCategoryTypesResult.data,
            accountTitles: searchAccountTitlesResult.data,
            productTypes: productTypes
        });
    }
);

offersRouter.all(
    '/:id/update',
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        let message = '';
        let errors: any = {};

        const itemOfferedTypeOf = req.query.itemOffered?.typeOf;
        if (itemOfferedTypeOf === ProductType.EventService) {
            res.redirect(`/ticketTypes/${req.params.id}/update`);

            return;
        }

        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchAccountTitlesResult = await accountTitleService.search({
            project: { ids: [req.project.id] }
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        try {
            let offer = await offerService.findById({ id: req.params.id });

            if (req.method === 'POST') {
                // 検証
                validate(req);
                const validatorResult = await req.getValidationResult();
                errors = req.validationErrors(true);

                // 検証
                if (validatorResult.isEmpty()) {
                    try {
                        req.body.id = req.params.id;
                        offer = await createFromBody(req, false);
                        await offerService.updateOffer(offer);
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);

                        return;
                    } catch (error) {
                        message = error.message;
                    }
                }
            }

            const forms = {
                ...offer,
                ...req.body
            };
            if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
                // tslint:disable-next-line:prefer-array-literal
                forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                    return {};
                }));
            }

            const searchOfferCategoryTypesResult = await categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
            });

            res.render('offers/update', {
                message: message,
                errors: errors,
                forms: forms,
                ticketTypeCategories: searchOfferCategoryTypesResult.data,
                accountTitles: searchAccountTitlesResult.data,
                productTypes: productTypes
            });
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.get(
    '/:id/catalogs',
    async (req, res) => {
        try {
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = 100;
            const page = 1;
            const { data } = await offerCatalogService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                itemListElement: {
                    id: { $in: [req.params.id] }
                }
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
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
);

offersRouter.get(
    '',
    async (req, res) => {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchOfferCategoryTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });

        // 券種マスタ画面遷移
        res.render('offers/index', {
            message: '',
            ticketTypeCategories: searchOfferCategoryTypesResult.data,
            productTypes: productTypes
        });
    }
);

offersRouter.get(
    '/getlist',
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchOfferCategoryTypesResult = await categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
            });
            const offerCategoryTypes = searchOfferCategoryTypesResult.data;

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const searchConditions: chevre.factory.offer.ISearchConditions = {
                limit: limit,
                page: page,
                sort: { 'priceSpecification.price': chevre.factory.sortType.Ascending },
                project: { id: { $eq: req.project.id } },
                itemOffered: {
                    typeOf: {
                        $eq: (typeof req.query.itemOffered?.typeOf === 'string' && req.query.itemOffered?.typeOf.length > 0)
                            ? req.query.itemOffered?.typeOf
                            : undefined
                    }
                },
                identifier: (req.query.identifier !== '' && req.query.identifier !== undefined) ? req.query.identifier : undefined,
                id: (typeof req.query.id === 'string' && req.query.id.length > 0) ? { $eq: req.query.id } : undefined,
                name: (req.query.name !== undefined
                    && req.query.name !== '')
                    ? { $regex: req.query.name }
                    : undefined,
                priceSpecification: {
                    price: {
                        $gte: (req.query.priceSpecification !== undefined
                            && req.query.priceSpecification.minPrice !== undefined
                            && req.query.priceSpecification.minPrice !== '')
                            ? Number(req.query.priceSpecification.minPrice)
                            : undefined,
                        $lte: (req.query.priceSpecification !== undefined
                            && req.query.priceSpecification.maxPrice !== undefined
                            && req.query.priceSpecification.maxPrice !== '')
                            ? Number(req.query.priceSpecification.maxPrice)
                            : undefined
                    },
                    referenceQuantity: {
                        value: {
                            $eq: (req.query.priceSpecification !== undefined
                                && req.query.priceSpecification.referenceQuantity !== undefined
                                && req.query.priceSpecification.referenceQuantity.value !== undefined
                                && req.query.priceSpecification.referenceQuantity.value !== '')
                                ? Number(req.query.priceSpecification.referenceQuantity.value)
                                : undefined
                        }
                    }
                },
                category: {
                    codeValue: (req.query.category !== undefined
                        && typeof req.query.category.codeValue === 'string'
                        && req.query.category.codeValue !== '')
                        ? { $in: [req.query.category.codeValue] }
                        : undefined
                }
            };

            let data: chevre.factory.offer.IUnitPriceOffer[];
            if (searchConditions.itemOffered?.typeOf?.$eq === ProductType.EventService) {
                const searchResult = await offerService.searchTicketTypes(searchConditions);
                data = searchResult.data;
            } else {
                const searchResult = await offerService.search(searchConditions);
                data = searchResult.data;
            }

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                // tslint:disable-next-line:cyclomatic-complexity
                results: data.map((t) => {
                    const categoryCode = t.category?.codeValue;

                    const productType = productTypes.find((p) => p.codeValue === t.itemOffered.typeOf);

                    return {
                        ...t,
                        ...(productType !== undefined) ? { itemOfferedName: productType.name } : undefined,
                        categoryName: (typeof categoryCode === 'string')
                            ? (<chevre.factory.multilingualString>offerCategoryTypes.find((c) => c.codeValue === categoryCode)?.name)?.ja
                            : '',
                        validRateLimitStr: ((<any>t).validRateLimit !== undefined && (<any>t).validRateLimit !== null)
                            ? `1 ${(<any>t).validRateLimit.scope} / ${(<any>t).validRateLimit.unitInSeconds} s`
                            : '',
                        addOnCount: (Array.isArray(t.addOn))
                            ? t.addOn.length
                            : 0
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
);

// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
async function createFromBody(req: Request, isNew: boolean): Promise<chevre.factory.offer.IUnitPriceOffer> {
    const body = req.body;

    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    let offerCategory: chevre.factory.categoryCode.ICategoryCode | undefined;

    if (typeof body.category?.codeValue === 'string' && body.category?.codeValue.length > 0) {
        const searchOfferCategoryTypesResult = await categoryCodeService.search({
            limit: 1,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } },
            codeValue: { $eq: body.category?.codeValue }
        });
        if (searchOfferCategoryTypesResult.data.length === 0) {
            throw new Error('オファーカテゴリーが見つかりません');
        }
        offerCategory = searchOfferCategoryTypesResult.data[0];
    }

    const availability: chevre.factory.itemAvailability = chevre.factory.itemAvailability.InStock;

    const referenceQuantityValue: number = Number(body.priceSpecification.referenceQuantity.value);
    const referenceQuantity: chevre.factory.quantitativeValue.IQuantitativeValue<chevre.factory.unitCode.C62> = {
        typeOf: <'QuantitativeValue'>'QuantitativeValue',
        value: referenceQuantityValue,
        unitCode: body.priceSpecification.referenceQuantity.unitCode
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
                project: req.project,
                typeOf: chevre.factory.priceSpecificationType.PriceSpecification,
                price: eligibleTransactionVolumePrice,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true
            }
            : undefined;

    const accounting = {
        typeOf: <'Accounting'>'Accounting',
        operatingRevenue: <any>undefined,
        accountsReceivable: Number(body.priceSpecification.price) // とりあえず発生金額に同じ
    };
    if (body.accountTitle !== undefined && body.accountTitle !== '') {
        accounting.operatingRevenue = {
            typeOf: 'AccountTitle',
            codeValue: body.accountTitle,
            identifier: body.accountTitle,
            name: ''
        };
    }

    let nameFromJson: any = {};
    if (typeof body.nameStr === 'string' && body.nameStr.length > 0) {
        try {
            nameFromJson = JSON.parse(body.nameStr);
        } catch (error) {
            throw new Error(`高度な名称の型が不適切です ${error.message}`);
        }
    }

    let validFrom: Date | undefined;
    if (typeof req.body.validFrom === 'string' && req.body.validFrom.length > 0) {
        validFrom = moment(`${req.body.validFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
            .toDate();
        // validFrom = moment(req.body.validFrom)
        //     .toDate();
    }

    let validThrough: Date | undefined;
    if (typeof req.body.validThrough === 'string' && req.body.validThrough.length > 0) {
        validThrough = moment(`${req.body.validThrough}T23:59:59+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
            .toDate();
        // validThrough = moment(req.body.validThrough)
        //     .toDate();
    }

    const priceSpec: chevre.factory.priceSpecification.IPriceSpecification<chevre.factory.priceSpecificationType.UnitPriceSpecification> = {
        project: req.project,
        typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
        name: body.name,
        price: Number(body.priceSpecification.price),
        priceCurrency: chevre.factory.priceCurrency.JPY,
        valueAddedTaxIncluded: true,
        referenceQuantity: referenceQuantity,
        accounting: accounting,
        eligibleQuantity: eligibleQuantity,
        eligibleTransactionVolume: eligibleTransactionVolume
    };

    let itemOffered;
    const itemOfferedTypeOf = body.itemOffered?.typeOf;
    switch (itemOfferedTypeOf) {
        case ProductType.Product:
            itemOffered = {
                project: req.project,
                typeOf: itemOfferedTypeOf
            };
            break;

        case ProductType.MembershipService:
            itemOffered = {
                project: req.project,
                typeOf: itemOfferedTypeOf,
                serviceOutput: { typeOf: chevre.factory.programMembership.ProgramMembershipType.ProgramMembership }
            };
            break;

        default:
            throw new Error(`${body.itemOffered?.typeOf} not implemented`);
    }

    return {
        project: req.project,
        typeOf: chevre.factory.offerType.Offer,
        priceCurrency: chevre.factory.priceCurrency.JPY,
        id: body.id,
        identifier: req.body.identifier,
        name: {
            ...nameFromJson,
            ja: body.name.ja,
            en: body.name.en
        },
        description: body.description,
        alternateName: { ja: <string>body.alternateName.ja, en: '' },
        availability: availability,
        itemOffered: itemOffered,
        // eligibleCustomerType: eligibleCustomerType,
        priceSpecification: priceSpec,
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        ...(offerCategory !== undefined)
            ? {
                category: {
                    project: offerCategory.project,
                    id: offerCategory.id,
                    codeValue: offerCategory.codeValue
                }
            }
            : undefined,
        ...(validFrom instanceof Date)
            ? {
                validFrom: validFrom
            }
            : undefined,
        ...(validThrough instanceof Date)
            ? {
                validThrough: validThrough
            }
            : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(offerCategory === undefined) ? { category: 1 } : undefined,
                    ...(validFrom === undefined) ? { validFrom: 1 } : undefined,
                    ...(validThrough === undefined) ? { validThrough: 1 } : undefined
                }
            }
            : undefined
    };
}

function validate(req: Request): void {
    let colName: string = 'コード';
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });

    colName = '名称';
    req.checkBody('name.ja')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_NAME_JA })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));

    colName = '代替名称';
    req.checkBody('alternateName.ja')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_NAME_JA })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA));

    colName = '適用数';
    req.checkBody('priceSpecification.referenceQuantity.value')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));

    colName = '適用単位';
    req.checkBody('priceSpecification.referenceQuantity.unitCode')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));

    colName = '発生金額';
    req.checkBody('priceSpecification.price')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .isNumeric()
        .len({ max: CHAGE_MAX_LENGTH })
        .withMessage(Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH));
}

export default offersRouter;
