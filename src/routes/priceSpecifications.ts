/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, Meta, validationResult } from 'express-validator';

import * as Message from '../message';

import { categoryCodeSets } from '../factory/categoryCodeSet';
import { priceSpecificationTypes } from '../factory/priceSpecificationType';

const priceSpecificationsRouter = Router();

priceSpecificationsRouter.get(
    '',
    async (req, res) => {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        // 上映方式タイプ検索
        const searchVideoFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
        });

        // 上映方式タイプ検索
        const searchSoundFormatFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType } }
        });

        // 座席区分検索
        const searchSeatingTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });

        // 決済カード(ムビチケ券種)区分検索
        const searchMovieTicketTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });

        res.render('priceSpecifications/index', {
            message: '',
            movieTicketTypes: searchMovieTicketTypesResult.data,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            priceSpecificationTypes: priceSpecificationTypes,
            videoFormatTypes: searchVideoFormatTypesResult.data,
            soundFormatTypes: searchSoundFormatFormatTypesResult.data,
            seatingTypes: searchSeatingTypesResult.data,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
        });
    }
);

priceSpecificationsRouter.get(
    '/search',
    async (req, res) => {
        try {
            const priceSpecificationService = new chevre.service.PriceSpecification({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = await priceSpecificationService.search(<any>{
                limit: limit,
                page: page,
                sort: { price: chevre.factory.sortType.Ascending },
                project: { ids: [req.project.id] },
                typeOf: (req.query.typeOf !== '') ? req.query.typeOf : undefined,
                appliesToMovieTicket: {
                    serviceTypes: (req.query.appliesToMovieTicketType !== '') ? [req.query.appliesToMovieTicketType] : undefined
                },
                appliesToCategoryCode: {
                    ...(typeof req.query.appliesToCategoryCode === 'string' && req.query.appliesToCategoryCode.length > 0)
                        ? {
                            $elemMatch: {
                                codeValue: { $eq: JSON.parse(req.query.appliesToCategoryCode).codeValue },
                                'inCodeSet.identifier': { $eq: JSON.parse(req.query.appliesToCategoryCode).inCodeSet.identifier }
                            }
                        }
                        : {}

                }
            });

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((d) => {
                    const appliesToCategoryCode = (Array.isArray((<any>d).appliesToCategoryCode))
                        ? (<any>d).appliesToCategoryCode[0] :
                        undefined;
                    const categoryCodeSet = categoryCodeSets.find(
                        (c) => c.identifier === appliesToCategoryCode?.inCodeSet?.identifier
                    );
                    const priceSpecificationType = priceSpecificationTypes.find((p) => p.codeValue === d.typeOf);

                    return {
                        ...d,
                        priceSpecificationTypeName: priceSpecificationType?.name,
                        appliesToCategoryCodeSetName: categoryCodeSet?.name,
                        appliesToCategoryCode: appliesToCategoryCode
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

priceSpecificationsRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        // 上映方式タイプ検索
        const searchVideoFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
        });

        // 上映方式タイプ検索
        const searchSoundFormatFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType } }
        });

        // 座席区分検索
        const searchSeatingTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });

        // 決済カード(ムビチケ券種)区分検索
        const searchMovieTicketTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });

        const projectService = new chevre.service.Project({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const project = await projectService.findById({ id: req.project.id });

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                try {
                    let priceSpecification = await createMovieFromBody(req, true);
                    const priceSpecificationService = new chevre.service.PriceSpecification({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    priceSpecification = await priceSpecificationService.create(priceSpecification);

                    req.flash('message', '登録しました');
                    res.redirect(`/priceSpecifications/${priceSpecification.id}/update`);

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

        res.render('priceSpecifications/new', {
            message: message,
            errors: errors,
            forms: forms,
            movieTicketTypes: searchMovieTicketTypesResult.data,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            priceSpecificationTypes: priceSpecificationTypes,
            videoFormatTypes: searchVideoFormatTypesResult.data,
            soundFormatTypes: searchSoundFormatFormatTypesResult.data,
            seatingTypes: searchSeatingTypesResult.data,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
            paymentServices: project.settings?.paymentServices
        });
    }
);

// tslint:disable-next-line:use-default-type-parameter
priceSpecificationsRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        // 上映方式タイプ検索
        const searchVideoFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
        });

        // 上映方式タイプ検索
        const searchSoundFormatFormatTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType } }
        });

        // 座席区分検索
        const searchSeatingTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
        });

        // 決済カード(ムビチケ券種)区分検索
        const searchMovieTicketTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });

        const priceSpecificationService = new chevre.service.PriceSpecification({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let priceSpecification = await priceSpecificationService.findById({
            id: req.params.id
        });

        const projectService = new chevre.service.Project({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const project = await projectService.findById({ id: req.project.id });

        if (req.method === 'POST') {
            // バリデーション
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            if (validatorResult.isEmpty()) {
                // コンテンツDB登録
                try {
                    priceSpecification = { ...await createMovieFromBody(req, false), id: priceSpecification.id };
                    await priceSpecificationService.update(priceSpecification);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            ...priceSpecification,
            ...(Array.isArray((<any>priceSpecification).appliesToCategoryCode)
                && (<any>priceSpecification).appliesToCategoryCode.length > 0)
                ? { appliesToCategoryCode: (<any>priceSpecification).appliesToCategoryCode[0] }
                : { appliesToCategoryCode: {} }
            // ...req.body
        };

        res.render('priceSpecifications/update', {
            message: message,
            errors: errors,
            forms: forms,
            movieTicketTypes: searchMovieTicketTypesResult.data,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            priceSpecificationTypes: priceSpecificationTypes,
            videoFormatTypes: searchVideoFormatTypesResult.data,
            soundFormatTypes: searchSoundFormatFormatTypesResult.data,
            seatingTypes: searchSeatingTypesResult.data,
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
            paymentServices: project.settings?.paymentServices
        });
    }
);

// tslint:disable-next-line:max-func-body-length
async function createMovieFromBody(req: Request, isNew: boolean): Promise<chevre.factory.priceSpecification.IPriceSpecification<any>> {
    let appliesToCategoryCode: chevre.factory.categoryCode.ICategoryCode | undefined;
    let appliesToVideoFormat: string | undefined;
    let appliesToMovieTicketType: string | undefined;
    let appliesToMovieTicketServiceOutputTypeOf: string | undefined;

    switch (req.body.typeOf) {
        case chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification:
            appliesToCategoryCode =
                (typeof req.body.appliesToCategoryCode === 'string' && req.body.appliesToCategoryCode.length > 0)
                    ? JSON.parse(req.body.appliesToCategoryCode)
                    : undefined;
            appliesToVideoFormat = undefined;

            break;

        case chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification:
            // req.body.appliesToMovieTicket?.id
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchMovieTicketTypesResult = await categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                id: { $eq: req.body.appliesToMovieTicket?.id },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
            });
            const movieTicketTypeCharge = searchMovieTicketTypesResult.data.shift();
            if (movieTicketTypeCharge === undefined) {
                throw new Error('適用決済カード区分が見つかりません');
            }
            appliesToMovieTicketType = movieTicketTypeCharge.codeValue;
            appliesToMovieTicketServiceOutputTypeOf = movieTicketTypeCharge.paymentMethod?.typeOf;

            // req.body.appliesToMovieTicket?.serviceTypeがコードの場合
            // appliesToMovieTicketType = req.body.appliesToMovieTicket?.serviceType;
            // appliesToMovieTicketServiceOutputTypeOf = req.body.appliesToMovieTicket?.serviceOutput?.typeOf;

            appliesToCategoryCode = undefined;
            appliesToVideoFormat = req.body.appliesToVideoFormat;

            break;

        default:
    }

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: req.body.typeOf,
        price: Number(req.body.price),
        priceCurrency: chevre.factory.priceCurrency.JPY,
        name: req.body.name,
        valueAddedTaxIncluded: true,
        ...(appliesToCategoryCode !== undefined)
            ? {
                appliesToCategoryCode: [{
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: 'CategoryCode',
                    codeValue: appliesToCategoryCode.codeValue,
                    inCodeSet: {
                        typeOf: 'CategoryCodeSet',
                        identifier: appliesToCategoryCode.inCodeSet.identifier
                    }
                }]
            }
            : undefined,
        ...(typeof appliesToVideoFormat === 'string' && appliesToVideoFormat.length > 0)
            ? { appliesToVideoFormat: req.body.appliesToVideoFormat }
            : undefined,
        ...(typeof appliesToMovieTicketType === 'string' && appliesToMovieTicketType.length > 0)
            ? {
                appliesToMovieTicket: {
                    typeOf: chevre.factory.service.paymentService.PaymentServiceType.MovieTicket,
                    serviceType: appliesToMovieTicketType,
                    serviceOutput: {
                        typeOf: appliesToMovieTicketServiceOutputTypeOf
                    }
                },
                // 互換性維持対応
                appliesToMovieTicketType: appliesToMovieTicketType
            }
            : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(appliesToCategoryCode === undefined)
                        ? { appliesToCategoryCode: 1 }
                        : undefined,
                    ...(appliesToVideoFormat === undefined)
                        ? { appliesToVideoFormat: 1 }
                        : undefined,
                    ...(typeof appliesToMovieTicketType !== 'string' || appliesToMovieTicketType.length === 0)
                        ? { appliesToMovieTicketType: 1, appliesToMovieTicket: 1 }
                        : undefined
                }
            } : undefined
    };
}

function validate() {
    return [
        body('typeOf')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '価格仕様タイプ')),

        body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30)),

        body('price')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '金額'))
            .isInt()
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(() => '数値を入力してください'),

        body('appliesToCategoryCode')
            .if((_: any, { req }: Meta) => req.body.typeOf === chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification)
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '適用区分')),

        body('appliesToMovieTicket.id')
            .if((_: any, { req }: Meta) => req.body.typeOf === chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification)
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '適用決済カード(ムビチケ券種)区分')),

        body('appliesToVideoFormat')
            .if((_: any, { req }: Meta) => req.body.typeOf === chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification)
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '決済カード(ムビチケ)適用上映方式区分'))
    ];

}

export default priceSpecificationsRouter;
