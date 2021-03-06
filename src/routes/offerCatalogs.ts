/**
 * オファーカタログ管理ルーター
 */
import { chevre } from '@cinerino/sdk';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';

import * as Message from '../message';

import { ProductType, productTypes } from '../factory/productType';

const NUM_ADDITIONAL_PROPERTY = 10;

// コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

const offerCatalogsRouter = Router();

offerCatalogsRouter.all<any>(
    '/add',
    ...validate(),
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });

        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });

        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = '';
                    let offerCatalog = await createFromBody(req);

                    // コード重複確認
                    const searchOfferCatalogsResult = await offerCatalogService.search({
                        project: { id: { $eq: req.project.id } },
                        identifier: { $eq: offerCatalog.identifier }
                    });
                    if (searchOfferCatalogsResult.data.length > 0) {
                        throw new Error('既に存在するコードです');
                    }

                    offerCatalog = await offerCatalogService.create(offerCatalog);
                    req.flash('message', '登録しました');
                    res.redirect(`/projects/${req.project.id}/offerCatalogs/${offerCatalog.id}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const searchServiceTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
        });

        let ticketTypeIds: string[] = [];
        if (typeof req.body.ticketTypes === 'string') {
            ticketTypeIds = [req.body.ticketTypes];
        } else if (Array.isArray(req.body.ticketTypes)) {
            ticketTypeIds = req.body.ticketTypes;
        }
        const forms = {
            additionalProperty: [],
            id: (typeof req.body.id !== 'string' || req.body.id.length === 0) ? '' : req.body.id,
            name: (req.body.name === undefined || req.body.name === null) ? {} : req.body.name,
            ticketTypes: (req.body.ticketTypes === undefined || req.body.ticketTypes === null) ? [] : ticketTypeIds,
            description: (req.body.description === undefined || req.body.description === null) ? {} : req.body.description,
            alternateName: (req.body.alternateName === undefined || req.body.alternateName === null) ? {} : req.body.alternateName,
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // オファー検索
        let offers: chevre.factory.offer.IOffer[] = [];
        if (Array.isArray(forms.itemListElement) && forms.itemListElement.length > 0) {
            const itemListElementIds = forms.itemListElement.map((element: any) => element.id);

            const searchOffersResult = await offerService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                id: {
                    $in: itemListElementIds
                }
            });

            // 登録順にソート
            offers = searchOffersResult.data.sort(
                (a, b) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id)
            );
        }

        res.render('offerCatalogs/add', {
            message: message,
            errors: errors,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data,
            offers: offers,
            productTypes: productTypes
        });
    }
);

// tslint:disable-next-line:use-default-type-parameter
offerCatalogsRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });

        const searchServiceTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
        });

        let offerCatalog = await offerCatalogService.findById({ id: req.params.id });

        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    // DB登録
                    req.body.id = req.params.id;
                    offerCatalog = await createFromBody(req);
                    await offerCatalogService.update(offerCatalog);
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
            ...offerCatalog,
            serviceType: offerCatalog.itemOffered.serviceType?.codeValue,
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // オファー検索
        let offers: chevre.factory.offer.IOffer[] = [];
        if (Array.isArray(forms.itemListElement) && forms.itemListElement.length > 0) {
            const itemListElementIds = forms.itemListElement.map((element: any) => element.id);

            const searchOffersResult = await offerService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                id: {
                    $in: itemListElementIds
                }
            });

            // 登録順にソート
            offers = searchOffersResult.data.sort(
                (a, b) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id)
            );
        }

        res.render('offerCatalogs/update', {
            message: message,
            errors: errors,
            offers: offers,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data,
            productTypes: productTypes
        });
    }
);

offerCatalogsRouter.delete(
    '/:id',
    async (req, res) => {
        try {
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const offerCatalog = await offerCatalogService.findById({ id: req.params.id });

            // 削除して問題ないカタログかどうか検証
            await preDelete(req, offerCatalog);

            await offerCatalogService.deleteById({ id: req.params.id });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            res.status(BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    }
);

async function preDelete(req: Request, offerCatalog: chevre.factory.offerCatalog.IOfferCatalog) {
    const eventService = new chevre.service.Event({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    const productService = new chevre.service.Product({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });

    // プロダクト確認
    const searchProductsResult = await productService.search({
        limit: 1,
        hasOfferCatalog: { id: { $eq: offerCatalog.id } }
    });
    if (searchProductsResult.data.length > 0) {
        throw new Error('関連するプロダクトが存在します');
    }

    // イベント確認
    const searchEventsResult = await eventService.search({
        limit: 1,
        typeOf: chevre.factory.eventType.ScreeningEvent,
        project: { id: { $eq: req.project.id } },
        hasOfferCatalog: { id: { $eq: offerCatalog.id } },
        sort: { endDate: chevre.factory.sortType.Descending },
        endFrom: new Date()
    });
    if (searchEventsResult.data.length > 0) {
        throw new Error('終了していないスケジュールが存在します');
    }

    switch (offerCatalog.itemOffered.typeOf) {
        case ProductType.MembershipService:
        case ProductType.PaymentCard:
        case ProductType.Product:
            break;

        case ProductType.EventService:

            break;

        default:
    }
}

offerCatalogsRouter.get(
    '/:id/offers',
    async (req, res) => {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const offerCatalog = await offerCatalogService.findById({ id: req.params.id });
            const offerIds = offerCatalog.itemListElement.map((element) => element.id);

            const limit = 100;
            const page = 1;
            let data: chevre.factory.offer.IOffer[];

            const searchResult = await offerService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                id: {
                    $in: offerIds
                }
            });
            data = searchResult.data;

            // 登録順にソート
            const offers = data.sort(
                (a, b) => offerIds.indexOf(<string>a.id) - offerIds.indexOf(<string>b.id)
            );

            res.json({
                success: true,
                count: (offers.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(offers.length),
                results: offers
            });
        } catch (err) {
            res.json({
                success: false,
                results: err
            });
        }
    }
);

offerCatalogsRouter.get(
    '',
    async (__, res) => {
        res.render('offerCatalogs/index', {
            message: '',
            ticketTypes: undefined,
            productTypes: productTypes
        });
    }
);

offerCatalogsRouter.get(
    '/getlist',
    async (req, res) => {
        try {
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            const searchServiceTypesResult = await categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
            });
            const serviceTypes = searchServiceTypesResult.data;

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await offerCatalogService.search({
                limit: limit,
                page: page,
                sort: { identifier: chevre.factory.sortType.Ascending },
                project: { id: { $eq: req.project.id } },
                identifier: req.query.identifier,
                name: req.query.name,
                itemListElement: {},
                itemOffered: {
                    serviceType: {
                        codeValue: {
                            $eq: (typeof req.query.itemOffered?.serviceType?.codeValue?.$eq === 'string'
                                && req.query.itemOffered.serviceType.codeValue.$eq.length > 0)
                                ? req.query.itemOffered.serviceType.codeValue.$eq
                                : undefined
                        }
                    },
                    typeOf: {
                        $eq: (typeof req.query.itemOffered?.typeOf?.$eq === 'string' && req.query.itemOffered?.typeOf?.$eq.length > 0)
                            ? req.query.itemOffered?.typeOf?.$eq
                            : undefined
                    }
                }
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((catalog) => {
                    const serviceType = serviceTypes.find((s) => s.codeValue === catalog.itemOffered.serviceType?.codeValue);

                    const productType = productTypes.find((p) => p.codeValue === catalog.itemOffered.typeOf);

                    return {
                        ...catalog,
                        ...(serviceType !== undefined) ? { serviceTypeName: (<any>serviceType.name).ja } : undefined,
                        ...(productType !== undefined) ? { itemOfferedName: productType.name } : undefined,
                        offerCount: (Array.isArray(catalog.itemListElement)) ? catalog.itemListElement.length : 0
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
);

offerCatalogsRouter.get(
    '/searchOffersByPrice',
    async (req, res) => {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient,
                project: { id: req.project.id }
            });

            let data: chevre.factory.offer.IOffer[];
            const limit = 100;
            const page = 1;
            const searchOffersResult = await offerService.search({
                limit: limit,
                page: page,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                project: { id: { $eq: req.project.id } },
                itemOffered: { typeOf: { $eq: req.query.itemOffered?.typeOf } },
                priceSpecification: {
                    // 売上金額で検索
                    accounting: {
                        accountsReceivable: {
                            $gte: Number(req.query.price),
                            $lte: Number(req.query.price)
                        }
                    }
                }
            });
            data = searchOffersResult.data;

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
                results: err
            });
        }
    }
);

async function createFromBody(req: Request): Promise<chevre.factory.offerCatalog.IOfferCatalog> {
    let itemListElement = [];
    if (Array.isArray(req.body.itemListElement)) {
        itemListElement = req.body.itemListElement.map((element: any) => {
            return {
                typeOf: chevre.factory.offerType.Offer,
                id: element.id
            };
        });
    }

    const MAX_NUM_OFFER = 100;
    if (itemListElement.length > MAX_NUM_OFFER) {
        throw new Error(`オファー数の上限は${MAX_NUM_OFFER}です`);
    }

    let serviceType: chevre.factory.serviceType.IServiceType | undefined;
    if (typeof req.body.serviceType === 'string' && req.body.serviceType.length > 0) {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });

        const searchServiceTypesResult = await categoryCodeService.search({
            limit: 1,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } },
            codeValue: { $eq: req.body.serviceType }
        });
        serviceType = searchServiceTypesResult.data.shift();
        if (serviceType === undefined) {
            throw new Error('サービス区分が見つかりません');
        }
        serviceType = {
            project: serviceType.project,
            id: serviceType.id,
            typeOf: serviceType.typeOf,
            codeValue: serviceType.codeValue,
            name: serviceType.name,
            inCodeSet: serviceType.inCodeSet
        };
    }

    return {
        typeOf: 'OfferCatalog',
        project: { typeOf: req.project.typeOf, id: req.project.id },
        id: req.body.id,
        identifier: req.body.identifier,
        name: req.body.name,
        description: req.body.description,
        alternateName: req.body.alternateName,
        itemListElement: itemListElement,
        itemOffered: {
            typeOf: req.body.itemOffered?.typeOf,
            ...(serviceType !== undefined) ? { serviceType } : undefined
        },
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

function validate() {
    return [
        body('identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLength('コード', NAME_MAX_LENGTH_CODE)),

        body('name.ja', Message.Common.required.replace('$fieldName$', '名称'))
            .notEmpty(),
        body('name.ja', Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_NAME_JA))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),

        body('name.en', Message.Common.required.replace('$fieldName$', '英語名称'))
            .notEmpty(),
        // tslint:disable-next-line:no-magic-numbers
        body('name.en', Message.Common.getMaxLength('英語名称', 128))
            .isLength({ max: 128 }),

        body('itemOffered.typeOf', Message.Common.required.replace('$fieldName$', 'アイテム'))
            .notEmpty(),

        body('itemListElement')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'オファーリスト'))
    ];
}

export default offerCatalogsRouter;
