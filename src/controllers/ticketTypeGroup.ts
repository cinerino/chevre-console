/**
 * 券種グループマスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Response } from 'express';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

const NUM_ADDITIONAL_PROPERTY = 10;

// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

/**
 * 一覧
 */
export async function index(__: Request, res: Response): Promise<void> {
    // 券種グループマスタ画面遷移
    res.render('ticketTypeGroup/index', {
        message: '',
        ticketTypes: undefined
    });
}
/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    const offerService = new chevre.service.Offer({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
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

                // 券種グループコード重複確認
                const { data } = await offerService.searchTicketTypeGroups({
                    project: { id: { $eq: req.project.id } },
                    identifier: { $eq: ticketTypeGroup.identifier }
                });
                if (data.length > 0) {
                    throw new Error(`既に存在する券種グループコードです: ${ticketTypeGroup.identifier}`);
                }

                ticketTypeGroup = await offerService.createTicketTypeGroup(ticketTypeGroup);
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
/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const offerService = new chevre.service.Offer({
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
                await offerService.updateTicketTypeGroup(ticketTypeGroup);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    // 券種グループ取得
    const ticketGroup = await offerService.findTicketTypeGroupById({ id: req.params.id });
    const forms = {
        additionalProperty: [],
        ...ticketGroup,
        serviceType: ticketGroup.itemOffered.serviceType?.codeValue,
        ticketTypes: ticketGroup.itemListElement.map((e) => e.id),
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
        ticketTypes: ticketTypes,
        itemOffered: {
            serviceType: serviceType,
            ...{
                typeOf: 'EventService' // 後にオファーカタログへ統合するため
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
        ...{
            itemListElement: itemListElement // 後にオファーカタログへ統合するため
        }
    };
}

/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = await offerService.searchTicketTypeGroups({
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
            results: data.map((g) => {
                return {
                    ...g,
                    offerCount: g.ticketTypes.length
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
 * 関連券種
 */
export async function getTicketTypeList(req: Request, res: Response): Promise<void> {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 券種グループ取得
        const ticketGroup = await offerService.findTicketTypeGroupById({ id: req.query.id });
        const offerIds = ticketGroup.itemListElement.map((e) => e.id);

        const limit = 100;
        const page = 1;
        const { data } = await offerService.searchTicketTypes({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            ids: offerIds
        });

        // 券種を登録順にソート
        const ticketTypes = data.sort((a, b) => offerIds.indexOf(a.id) - offerIds.indexOf(b.id));

        res.json({
            success: true,
            count: (ticketTypes.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(ticketTypes.length),
            results: ticketTypes.map((t) => (t.alternateName !== undefined) ? t.alternateName.ja : t.name.ja)
        });
    } catch (err) {
        res.json({
            success: false,
            results: err
        });
    }
}

/**
 * 券種金額
 */
export async function getTicketTypePriceList(req: Request, res: Response): Promise<void> {
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
/**
 * 削除
 */
export async function deleteById(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const ticketTypeGroupId: string = req.params.id;

        // 削除して問題ない券種グループかどうか検証
        const searchEventsResult = await eventService.search({
            limit: 1,
            typeOf: chevre.factory.eventType.ScreeningEvent,
            project: { ids: [req.project.id] },
            offers: {
                ids: [ticketTypeGroupId]
            },
            sort: { endDate: chevre.factory.sortType.Descending }
        });
        if (searchEventsResult.data.length > 0) {
            if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                throw new Error('終了していないスケジュールが存在します');
            }
        }

        await offerService.deleteTicketTypeGroup({ id: ticketTypeGroupId });
        res.status(NO_CONTENT).end();
    } catch (error) {
        res.status(BAD_REQUEST).json({ error: { message: error.message } });
    }
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
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '名称英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128)).len({ max: 128 });
    // 興行区分
    colName = '興行区分';
    req.checkBody('serviceType', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    //対象券種名
    colName = 'オファーリスト';
    req.checkBody('ticketTypes', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
