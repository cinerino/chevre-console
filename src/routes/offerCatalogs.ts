/**
 * オファーカタログ管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

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
                    const { data } = await offerService.searchTicketTypeGroups({
                        project: { ids: [req.project.id] },
                        identifier: { $eq: offerCatalog.identifier }
                    });
                    if (data.length > 0) {
                        throw new Error(`既に存在するコードです: ${offerCatalog.identifier}`);
                    }

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
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // 券種マスタから取得
        let ticketTypes: chevre.factory.ticketType.ITicketType[] = [];
        if (typeof forms.ticketTypes === 'string') {
            forms.ticketTypes = [forms.ticketTypes];
        }
        if (forms.ticketTypes.length > 0) {
            const searchTicketTypesResult = await offerService.searchTicketTypes({
                // sort: {
                //     'priceSpecification.price': chevre.factory.sortType.Descending
                // },
                project: { ids: [req.project.id] },
                ids: forms.ticketTypes
            });
            ticketTypes = searchTicketTypesResult.data;

            // 券種を登録順にソート
            ticketTypes = ticketTypes.sort((a, b) => forms.ticketTypes.indexOf(a.id) - forms.ticketTypes.indexOf(b.id));
        }

        res.render('offerCatalogs/add', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data,
            offers: []
        });
    }
);

offerCatalogsRouter.all(
    '/:id/update',
    async (req, res) => {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        let offerCatalog = await offerCatalogService.findById({ id: req.params.id });

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
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        // オファー検索
        let offers: chevre.factory.offer.IOffer[] = [];
        if (forms.itemListElement.length > 0) {
            const searchOffersResult = await offerService.search({
                limit: 100,
                // sort: {
                //     'priceSpecification.price': chevre.factory.sortType.Descending
                // },
                project: { id: { $eq: req.project.id } },
                id: <any>{
                    $in: forms.itemListElement.map((element: any) => element.id)
                }
            });

            // 登録順にソート
            offers = searchOffersResult.data.sort(
                (a: any, b: any) => offerCatalog.itemListElement.indexOf(a.id) - offerCatalog.itemListElement.indexOf(b.id)
            );
        }

        res.render('offerCatalogs/update', {
            message: message,
            errors: errors,
            offers: offers,
            forms: forms
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

            await offerCatalogService.deleteById({ id: req.params.id });
            res.status(NO_CONTENT).end();
        } catch (error) {
            res.status(BAD_REQUEST).json({ error: { message: error.message } });
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

            const limit = 100;
            const page = 1;
            const { data } = await offerService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                id: <any>{
                    $in: offerCatalog.itemListElement.map((element: any) => element.id)
                }
            });

            // 登録順にソート
            const offers = data.sort(
                (a: any, b: any) => offerCatalog.itemListElement.indexOf(a.id) - offerCatalog.itemListElement.indexOf(b.id)
            );

            res.json({
                success: true,
                count: (offers.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(offers.length),
                results: offers.map((o) => (<any>o.name).ja)
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

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await offerCatalogService.search({
                limit: limit,
                page: page,
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
                    return {
                        ...catalog,
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

            // 指定価格のオファー検索
            const limit = 100;
            const page = 1;
            const { data } = await offerService.search({
                limit: limit,
                page: page,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                project: { id: { $eq: req.project.id } },
                priceSpecification: {
                    // price: {
                    // }
                    // 売上金額で検索
                    accounting: {
                        accountsReceivable: {
                            $gte: Number(req.query.price),
                            $lte: Number(req.query.price)
                        }
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
        } catch (err) {
            res.json({
                success: false,
                results: err
            });
        }
    }
);

async function createFromBody(req: Request): Promise<any> {
    const body = req.body;

    const itemListElement = (Array.isArray(body.itemListElement)) ? <string[]>body.itemListElement : [];

    return {
        project: req.project,
        id: body.id,
        identifier: req.body.identifier,
        name: body.name,
        description: body.description,
        alternateName: body.alternateName,
        itemListElement: [...new Set(itemListElement)], // 念のため券種IDをユニークに
        itemOffered: {
            typeOf: body.itemOffered?.typeOf
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
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });

    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });

    colName = '名称(英)';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128)).len({ max: 128 });

    colName = '対象オファー';
    req.checkBody('itemListElement', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
}

export default offerCatalogsRouter;
