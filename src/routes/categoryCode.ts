/**
 * カテゴリーコードルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, Meta, validationResult } from 'express-validator';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';

import * as Message from '../message';

import { categoryCodeSets } from '../factory/categoryCodeSet';

const categoryCodesRouter = Router();

categoryCodesRouter.get(
    '',
    async (_, res) => {
        res.render('categoryCodes/index', {
            message: '',
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
            categoryCodeSets: categoryCodeSets
        });
    }
);

categoryCodesRouter.get(
    '/search',
    async (req, res) => {
        try {
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await categoryCodeService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                ...(req.query.codeValue !== undefined && req.query.codeValue !== null
                    && typeof req.query.codeValue.$eq === 'string' && req.query.codeValue.$eq.length > 0)
                    ? { codeValue: { $eq: req.query.codeValue.$eq } }
                    : undefined,
                ...(req.query.inCodeSet !== undefined && req.query.inCodeSet !== null
                    && typeof req.query.inCodeSet.identifier === 'string' && req.query.inCodeSet.identifier.length > 0)
                    ? { inCodeSet: { identifier: { $eq: req.query.inCodeSet.identifier } } }
                    : undefined,
                ...(req.query.name !== undefined && req.query.name !== null
                    && typeof req.query.name.$regex === 'string' && req.query.name.$regex.length > 0)
                    ? { name: { $regex: req.query.name.$regex } }
                    : undefined
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((d) => {
                    const categoryCodeSet = categoryCodeSets.find((c) => c.identifier === d.inCodeSet.identifier);

                    return {
                        ...d,
                        categoryCodeSetName: categoryCodeSet?.name
                    };
                })
            });
        } catch (error) {
            res.json({
                success: false,
                message: error.message,
                count: 0,
                results: []
            });
        }
    }
);

categoryCodesRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    let categoryCode = createMovieFromBody(req);

                    // コード重複確認
                    const { data } = await categoryCodeService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        codeValue: { $eq: categoryCode.codeValue },
                        inCodeSet: { identifier: { $eq: categoryCode.inCodeSet.identifier } }
                    });
                    if (data.length > 0) {
                        throw new Error('既に存在するコードです');
                    }

                    categoryCode = await categoryCodeService.create(categoryCode);

                    req.flash('message', '登録しました');
                    res.redirect(`/categoryCodes/${(<any>categoryCode).id}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            appliesToCategoryCode: {},
            ...req.body
        };

        const productService = new chevre.service.Product({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchProductsResult = await productService.search({
            project: { id: { $eq: req.project.id } },
            typeOf: {
                $in: [
                    chevre.factory.service.paymentService.PaymentServiceType.CreditCard,
                    chevre.factory.service.paymentService.PaymentServiceType.MovieTicket
                ]
            }
        });

        res.render('categoryCodes/new', {
            message: message,
            errors: errors,
            forms: forms,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
            categoryCodeSets: categoryCodeSets,
            paymentServices: searchProductsResult.data
        });
    }
);

// tslint:disable-next-line:use-default-type-parameter
categoryCodesRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let categoryCode = await categoryCodeService.findById({
            id: req.params.id
        });

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                // コンテンツDB登録
                try {
                    categoryCode = { ...createMovieFromBody(req), ...{ id: (<any>categoryCode).id } };
                    await categoryCodeService.update(categoryCode);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...categoryCode,
            ...req.body
        };

        const productService = new chevre.service.Product({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchProductsResult = await productService.search({
            project: { id: { $eq: req.project.id } },
            typeOf: {
                $in: [
                    chevre.factory.service.paymentService.PaymentServiceType.CreditCard,
                    chevre.factory.service.paymentService.PaymentServiceType.MovieTicket
                ]
            }
        });

        res.render('categoryCodes/update', {
            message: message,
            errors: errors,
            forms: forms,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
            categoryCodeSets: categoryCodeSets,
            paymentServices: searchProductsResult.data
        });
    }
);

categoryCodesRouter.delete(
    '/:id',
    async (req, res) => {
        try {
            // const eventService = new chevre.service.Event({
            //     endpoint: <string>process.env.API_ENDPOINT,
            //     auth: req.user.authClient
            // });
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const categoryCode = await categoryCodeService.findById({ id: req.params.id });
            await preDelete(req, categoryCode);

            await categoryCodeService.deleteById({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            res.status(BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    }
);

// tslint:disable-next-line:max-func-body-length
async function preDelete(req: Request, categoryCode: chevre.factory.categoryCode.ICategoryCode) {
    // validation
    const creativeWorkService = new chevre.service.CreativeWork({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const offerService = new chevre.service.Offer({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const offerCatalogService = new chevre.service.OfferCatalog({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const priceSpecificationService = new chevre.service.PriceSpecification({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    // 関連する価格仕様
    const searchPriceSpecificationsResult = await priceSpecificationService.search({
        limit: 1,
        project: { id: { $eq: req.project.id } },
        appliesToCategoryCode: {
            $elemMatch: {
                codeValue: { $eq: categoryCode.codeValue },
                'inCodeSet.identifier': { $eq: categoryCode.inCodeSet.identifier }
            }
        }
    });
    if (searchPriceSpecificationsResult.data.length > 0) {
        throw new Error('関連する価格仕様が存在します');
    }

    switch (categoryCode.inCodeSet.identifier) {
        // 通貨区分
        case chevre.factory.categoryCode.CategorySetIdentifier.AccountType:
            break;
        // レイティング区分
        case chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType:
            const searchMoviesResult4contentRating = await creativeWorkService.searchMovies({
                limit: 1,
                project: { ids: [req.project.id] },
                contentRating: { $eq: categoryCode.codeValue }
            });
            if (searchMoviesResult4contentRating.data.length > 0) {
                throw new Error('関連するコンテンツが存在します');
            }
            break;
        // 配給区分
        case chevre.factory.categoryCode.CategorySetIdentifier.DistributorType:
            const searchMoviesResult4distributorType = await creativeWorkService.searchMovies({
                limit: 1,
                project: { ids: [req.project.id] },
                distributor: { codeValue: { $eq: categoryCode.codeValue } }
            });
            if (searchMoviesResult4distributorType.data.length > 0) {
                throw new Error('関連するコンテンツが存在します');
            }
            break;
        // 決済カード(ムビチケ券種)区分
        case chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType:
            // const searchOffersResult = await offerService.search({
            //     limit: 1,
            //     project: { id: { $eq: req.project.id } }
            // });
            // if (searchOffersResult.data.length > 0) {
            //     throw new Error('関連するオファーが存在します');
            // }
            break;
        // オファーカテゴリー区分
        case chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType:
            const searchOffersResult = await offerService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                category: { codeValue: { $in: [categoryCode.codeValue] } }
            });
            if (searchOffersResult.data.length > 0) {
                throw new Error('関連するオファーが存在します');
            }
            break;
        // 決済方法区分
        case chevre.factory.categoryCode.CategorySetIdentifier.PaymentMethodType:
            break;
        // 座席区分
        case chevre.factory.categoryCode.CategorySetIdentifier.SeatingType:
            const searchSeatsResult = await placeService.searchSeats({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                seatingType: { $eq: categoryCode.codeValue }
            });
            if (searchSeatsResult.data.length > 0) {
                throw new Error('関連する座席が存在します');
            }
            break;
        // サービス区分
        case chevre.factory.categoryCode.CategorySetIdentifier.ServiceType:
            const searchOfferCatalogsResult = await offerCatalogService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                itemOffered: { serviceType: { codeValue: { $eq: categoryCode.codeValue } } }
            });
            if (searchOfferCatalogsResult.data.length > 0) {
                throw new Error('関連するオファーカタログが存在します');
            }
            break;
        // 音響方式区分
        case chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType:
            // 関連する施設コンテンツ
            break;
        // 上映方式区分
        case chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType:
            // 関連する施設コンテンツ
            break;
        default:
    }
}

function createMovieFromBody(req: Request): chevre.factory.categoryCode.ICategoryCode {
    const paymentMethodType = req.body.paymentMethod?.typeOf;

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: 'CategoryCode',
        codeValue: req.body.codeValue,
        inCodeSet: {
            typeOf: 'CategoryCodeSet',
            identifier: req.body.inCodeSet.identifier
        },
        name: <any>{ ja: req.body.name.ja },
        ...(req.body.inCodeSet.identifier === chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType)
            ? {
                paymentMethod: {
                    typeOf: (typeof paymentMethodType === 'string' && paymentMethodType.length > 0)
                        ? paymentMethodType
                        // デフォルトはとりあえず固定でムビチケ
                        : chevre.factory.paymentMethodType.MovieTicket
                }
            }
            : undefined
    };
}

function validate() {
    return [
        body('inCodeSet.identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '区分分類')),

        body('codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            // .isAlphanumeric()
            .matches(/^[0-9a-zA-Z\+]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('コード', 20)),

        body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30)),

        body('paymentMethod.typeOf')
            .if((_: any, { req }: Meta) => {
                return req.body.inCodeSet?.identifier === chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType;
            })
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '決済方法'))
    ];
}

export default categoryCodesRouter;
