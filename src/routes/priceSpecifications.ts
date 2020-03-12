/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';

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

        // ムビチケ券種区分検索
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
                    // const mvtkType = mvtk.util.constants.TICKET_TYPE.find((t) => t.code === (<any>d).appliesToMovieTicketType);
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
                        appliesToCategoryCode: appliesToCategoryCode,
                        appliesToMovieTicket: {
                            name: ''
                        }
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

priceSpecificationsRouter.all(
    '/new',
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

        // ムビチケ券種区分検索
        const searchMovieTicketTypesResult = await categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
        });

        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    let priceSpecification = createMovieFromBody(req, true);
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
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
        });
    }
);

priceSpecificationsRouter.all(
    '/:id/update',
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

        // ムビチケ券種区分検索
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

        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    priceSpecification = { ...createMovieFromBody(req, false), id: priceSpecification.id };
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
            CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
        });
    }
);

function createMovieFromBody(req: Request, isNew: boolean): chevre.factory.priceSpecification.IPriceSpecification<any> {
    const body = req.body;

    let appliesToCategoryCode: chevre.factory.categoryCode.ICategoryCode | undefined;
    let appliesToVideoFormat: string | undefined;
    let appliesToMovieTicketType: string | undefined;

    switch (body.typeOf) {
        case chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification:
            appliesToCategoryCode =
                (typeof body.appliesToCategoryCode === 'string' && body.appliesToCategoryCode.length > 0)
                    ? JSON.parse(body.appliesToCategoryCode)
                    : undefined;
            appliesToVideoFormat = undefined;
            appliesToMovieTicketType = undefined;

            break;

        case chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification:
            appliesToCategoryCode = undefined;
            appliesToVideoFormat = body.appliesToVideoFormat;
            appliesToMovieTicketType = body.appliesToMovieTicketType;

            break;

        default:
    }

    return {
        project: req.project,
        typeOf: body.typeOf,
        price: Number(body.price),
        priceCurrency: chevre.factory.priceCurrency.JPY,
        name: body.name,
        valueAddedTaxIncluded: true,
        ...(appliesToCategoryCode !== undefined)
            ? {
                appliesToCategoryCode: [{
                    project: req.project,
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
            ? { appliesToVideoFormat: body.appliesToVideoFormat }
            : undefined,
        ...(typeof appliesToMovieTicketType === 'string' && appliesToMovieTicketType.length > 0)
            ? { appliesToMovieTicketType: body.appliesToMovieTicketType }
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
                    ...(appliesToMovieTicketType === undefined)
                        ? { appliesToMovieTicketType: 1 }
                        : undefined
                }
            } : undefined
    };
}

function validate(req: Request): void {
    let colName: string = '';

    colName = '価格仕様タイプ';
    req.checkBody('typeOf')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName));

    colName = '名称';
    req.checkBody('name.ja')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        // tslint:disable-next-line:no-magic-numbers
        .withMessage(Message.Common.getMaxLength(colName, 30));

    switch (req.body.typeOf) {
        case chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification:
            colName = '適用区分';
            req.checkBody('appliesToCategoryCode')
                .notEmpty()
                .withMessage(Message.Common.required.replace('$fieldName$', colName));

            break;

        case chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification:
            colName = '適用ムビチケ券種区分';
            req.checkBody('appliesToMovieTicketType')
                .notEmpty()
                .withMessage(Message.Common.required.replace('$fieldName$', colName));

            colName = 'ムビチケ適用上映方式区分';
            req.checkBody('appliesToVideoFormat')
                .notEmpty()
                .withMessage(Message.Common.required.replace('$fieldName$', colName));

            break;

        default:
    }
}

export default priceSpecificationsRouter;
