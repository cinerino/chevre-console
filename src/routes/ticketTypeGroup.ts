/**
 * 券種グループマスタ管理ルーター
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

const ticketTypeGroupMasterRouter = Router();

ticketTypeGroupMasterRouter.all(
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
                    let ticketTypeGroup = await createFromBody(req);

                    // コード重複確認
                    const searchOfferCatalogsResult = await offerCatalogService.search({
                        project: { id: { $eq: req.project.id } },
                        identifier: { $eq: ticketTypeGroup.identifier }
                    });
                    if (searchOfferCatalogsResult.data.length > 0) {
                        throw new Error(`既に存在するコードです: ${ticketTypeGroup.identifier}`);
                    }

                    ticketTypeGroup = await offerCatalogService.create(ticketTypeGroup);
                    req.flash('message', '登録しました');
                    res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);

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

        res.render('ticketTypeGroup/add', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data
        });
    }
);

ticketTypeGroupMasterRouter.all(
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
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchServiceTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }
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
                    // 券種グループDB登録
                    req.body.id = req.params.id;
                    const ticketTypeGroup = await createFromBody(req);
                    await offerCatalogService.update(ticketTypeGroup);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        // 券種グループ取得
        const catalog = await offerCatalogService.findById({ id: req.params.id });
        const forms = {
            additionalProperty: [],
            ...catalog,
            serviceType: catalog.itemOffered.serviceType?.codeValue,
            ticketTypes: catalog.itemListElement.map((e) => e.id),
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
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
                limit: 100,
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

        res.render('ticketTypeGroup/update', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            serviceTypes: searchServiceTypesResult.data
        });
    }
);

ticketTypeGroupMasterRouter.delete(
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
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            res.status(BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    }
);

// ticketTypeGroupMasterRouter.get('/ticketTypeList', ticketTypeGroupsController.getTicketTypeList);
ticketTypeGroupMasterRouter.get(
    '',
    async (__, res) => {
        // 券種グループマスタ画面遷移
        res.render('ticketTypeGroup/index', {
            message: '',
            ticketTypes: undefined
        });
    }
);

ticketTypeGroupMasterRouter.get(
    '/getTicketTypePriceList',
    async (req, res) => {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            // 指定価格の券種検索
            const limit = 100;
            const page = 1;
            const { data } = await offerService.searchTicketTypes({
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

    let ticketTypes = (Array.isArray(body.ticketTypes)) ? <string[]>body.ticketTypes : [<string>body.ticketTypes];
    ticketTypes = [...new Set(ticketTypes)]; // 念のため券種IDをユニークに

    const itemListElement = ticketTypes.map((offerId) => {
        return {
            typeOf: chevre.factory.offerType.Offer,
            id: offerId
        };
    });

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
    const serviceType = searchServiceTypesResult.data.shift();
    if (serviceType === undefined) {
        throw new Error('興行区分が見つかりません');
    }

    return {
        project: req.project,
        id: body.id,
        identifier: req.body.identifier,
        name: body.name,
        description: body.description,
        alternateName: body.alternateName,
        itemListElement: itemListElement, // 後にオファーカタログへ統合するため
        itemOffered: {
            typeOf: 'EventService', // 後にオファーカタログへ統合するため
            serviceType: serviceType
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

/**
 * 券種グループマスタ新規登録画面検証
 */
function validate(req: Request): void {
    // コード
    let colName: string = 'コード';
    req.checkBody('identifier')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .matches(/^[0-9a-zA-Z]+$/)
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));

    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '名称英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128))
        .len({ max: 128 });
    // 興行区分
    colName = '興行区分';
    req.checkBody('serviceType', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    //対象券種名
    colName = 'オファーリスト';
    req.checkBody('ticketTypes', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
}

export default ticketTypeGroupMasterRouter;
