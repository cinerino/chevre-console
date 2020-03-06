/**
 * オファーカタログ管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as _ from 'underscore';

import * as Message from '../message';

const NUM_ADDITIONAL_PROPERTY = 10;

// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

const offerCatalogsRouter = Router();

offerCatalogsRouter.all(
    '/add',
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
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
                        throw new Error(`既に存在するコードです: ${offerCatalog.identifier}`);
                    }

                    offerCatalog = await offerCatalogService.create(offerCatalog);
                    req.flash('message', '登録しました');
                    res.redirect(`/offerCatalogs/${offerCatalog.id}/update`);

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
        if (!_.isEmpty(req.body.ticketTypes)) {
            if (_.isString(req.body.ticketTypes)) {
                ticketTypeIds = [req.body.ticketTypes];
            } else {
                ticketTypeIds = req.body.ticketTypes;
            }
        }
        const forms = {
            additionalProperty: [],
            id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
            name: (_.isEmpty(req.body.name)) ? {} : req.body.name,
            ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : ticketTypeIds,
            description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
            alternateName: (_.isEmpty(req.body.alternateName)) ? {} : req.body.alternateName,
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

            if (forms.itemOffered?.typeOf === 'EventService') {
                const searchTicketTypesResult = await offerService.searchTicketTypes({
                    limit: 100,
                    project: { ids: [req.project.id] },
                    ids: itemListElementIds
                });

                // 登録順にソート
                offers = searchTicketTypesResult.data.sort(
                    (a: any, b: any) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id)
                );
            } else {
                const searchOffersResult = await offerService.search({
                    limit: 100,
                    project: { id: { $eq: req.project.id } },
                    id: {
                        $in: itemListElementIds
                    }
                });

                // 登録順にソート
                offers = searchOffersResult.data.sort(
                    (a: any, b: any) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id)
                );
            }
        }

        res.render('offerCatalogs/add', {
            message: message,
            errors: errors,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data,
            offers: offers
        });
    }
);

offerCatalogsRouter.all(
    '/:id/update',
    // tslint:disable-next-line:max-func-body-length
    async (req, res) => {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchServiceTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
        });

        let offerCatalog = await offerCatalogService.findById({ id: req.params.id });
        // if (offerCatalog.itemOffered.typeOf === 'EventService') {
        //     res.redirect(`/ticketTypeGroups/${offerCatalog.id}/update`);

        //     return;
        // }

        let message = '';
        let errors: any = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    // 券種グループDB登録
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

            if (forms.itemOffered?.typeOf === 'EventService') {
                const searchTicketTypesResult = await offerService.searchTicketTypes({
                    limit: 100,
                    project: { ids: [req.project.id] },
                    ids: itemListElementIds
                });

                // 登録順にソート
                offers = searchTicketTypesResult.data.sort(
                    (a: any, b: any) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id)
                );
            } else {
                const searchOffersResult = await offerService.search({
                    limit: 100,
                    project: { id: { $eq: req.project.id } },
                    id: {
                        $in: itemListElementIds
                    }
                });

                // 登録順にソート
                offers = searchOffersResult.data.sort(
                    (a: any, b: any) => itemListElementIds.indexOf(a.id) - itemListElementIds.indexOf(b.id)
                );
            }
        }

        res.render('offerCatalogs/update', {
            message: message,
            errors: errors,
            offers: offers,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data
        });
    }
);

offerCatalogsRouter.delete(
    '/:id',
    async (req, res) => {
        try {
            const eventService = new chevre.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const offerCatalog = await offerCatalogService.findById({ id: req.params.id });

            // tslint:disable-next-line:no-suspicious-comment
            // TODO 削除して問題ないカタログかどうか検証

            if (offerCatalog.itemOffered.typeOf === 'EventService') {
                // 削除して問題ない券種グループかどうか検証
                const searchEventsResult = await eventService.search({
                    limit: 1,
                    typeOf: chevre.factory.eventType.ScreeningEvent,
                    project: { ids: [req.project.id] },
                    offers: {
                        ids: [req.params.id]
                    },
                    sort: { endDate: chevre.factory.sortType.Descending }
                });
                if (searchEventsResult.data.length > 0) {
                    if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                        throw new Error('終了していないスケジュールが存在します');
                    }
                }
            }

            await offerCatalogService.deleteById({ id: req.params.id });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            res.status(BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    }
);

offerCatalogsRouter.get(
    '/:id/offers',
    async (req, res) => {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const offerCatalog = await offerCatalogService.findById({ id: req.params.id });
            const offerIds = offerCatalog.itemListElement.map((element) => element.id);

            const limit = 100;
            const page = 1;
            let data: chevre.factory.offer.IOffer[];

            if (offerCatalog.itemOffered.typeOf === 'EventService') {
                const searchTicketTypesResult = await offerService.searchTicketTypes({
                    limit: limit,
                    page: page,
                    project: { ids: [req.project.id] },
                    ids: offerIds
                });
                data = searchTicketTypesResult.data;
            } else {
                const searchResult = await offerService.search({
                    limit: limit,
                    page: page,
                    project: { id: { $eq: req.project.id } },
                    id: {
                        $in: offerIds
                    }
                });
                data = searchResult.data;
            }

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
            ticketTypes: undefined
        });
    }
);

offerCatalogsRouter.get(
    '/getlist',
    async (req, res) => {
        try {
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
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

                    return {
                        ...catalog,
                        ...(serviceType !== undefined) ? { serviceTypeName: (<any>serviceType.name).ja } : undefined,
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
                auth: req.user.authClient
            });

            const itemOfferedType = req.query.itemOffered?.typeOf;

            let data: chevre.factory.offer.IOffer[];
            const limit = 100;
            const page = 1;
            if (itemOfferedType === 'EventService') {
                const searchTicketTypesResult = await offerService.searchTicketTypes({
                    limit: limit,
                    page: page,
                    sort: {
                        'priceSpecification.price': chevre.factory.sortType.Descending
                    },
                    project: { ids: [req.project.id] },
                    priceSpecification: {
                        // 売上金額で検索
                        accounting: {
                            minAccountsReceivable: Number(req.query.price),
                            maxAccountsReceivable: Number(req.query.price)
                        }
                    }
                });
                data = searchTicketTypesResult.data;
            } else {
                // 指定価格のオファー検索
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
            }

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
    const body = req.body;

    let itemListElement = [];
    if (Array.isArray(body.itemListElement)) {
        itemListElement = body.itemListElement.map((element: any) => {
            return {
                typeOf: chevre.factory.offerType.Offer,
                id: element.id
            };
        });
    }

    let serviceType: chevre.factory.serviceType.IServiceType | undefined;
    if (typeof req.body.serviceType === 'string' && req.body.serviceType.length > 0) {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
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
        project: req.project,
        id: body.id,
        identifier: req.body.identifier,
        name: body.name,
        description: body.description,
        alternateName: body.alternateName,
        itemListElement: itemListElement,
        itemOffered: {
            typeOf: body.itemOffered?.typeOf,
            ...(serviceType !== undefined) ? { serviceType } : undefined
        },
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined
    };
}

function validate(req: Request): void {
    let colName: string = 'コード';
    req.checkBody('identifier')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));

    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });

    colName = '名称(英)';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128))
        .len({ max: 128 });

    colName = 'アイテム';
    req.checkBody('itemOffered.typeOf', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();

    // サービス区分
    // if (req.body.itemOffered?.typeOf === 'EventService') {
    //     colName = 'サービス区分';
    //     req.checkBody('serviceType')
    //         .notEmpty()
    //         .withMessage(Message.Common.required.replace('$fieldName$', colName));
    // }

    colName = 'オファーリスト';
    req.checkBody('itemListElement')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));
}

export default offerCatalogsRouter;
