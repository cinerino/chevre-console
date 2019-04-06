/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { mvtk } from '@movieticket/reserve-api-abstract-client';
import { Request, Router } from 'express';

import * as Message from '../common/Const/Message';

const priceSpecificationsRouter = Router();

priceSpecificationsRouter.get(
    '',
    async (_, res) => {
        res.render('priceSpecifications/index', {
            message: '',
            MovieTicketType: mvtk.util.constants.TICKET_TYPE,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            VideoFormatType: chevre.factory.videoFormatType,
            SoundFormatType: chevre.factory.soundFormatType
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
            const result = await priceSpecificationService.search({
                limit: Number(req.query.limit),
                page: Number(req.query.page),
                sort: { price: chevre.factory.sortType.Ascending },
                typeOf: (req.query.typeOf !== '') ? req.query.typeOf : undefined,
                appliesToMovieTicket: {
                    serviceTypes: (req.query.appliesToMovieTicketType !== '') ? [req.query.appliesToMovieTicketType] : undefined
                },
                appliesToVideoFormats: (req.query.appliesToVideoFormat !== '') ? [req.query.appliesToVideoFormat] : undefined,
                appliesToSoundFormats: (req.query.appliesToSoundFormat !== '') ? [req.query.appliesToSoundFormat] : undefined
            });

            res.json({
                success: true,
                count: result.totalCount,
                results: result.data.map((d) => {
                    const mvtkType = mvtk.util.constants.TICKET_TYPE.find((t) => t.code === (<any>d).appliesToMovieTicketType);

                    return {
                        ...d,
                        appliesToMovieTicket: {
                            name: ((<any>d).appliesToMovieTicketType !== undefined && mvtkType !== undefined)
                                ? mvtkType.name
                                : undefined
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

        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    let priceSpecification = createMovieFromBody(req.body);
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
            ...req.body
        };

        res.render('priceSpecifications/new', {
            message: message,
            errors: errors,
            forms: forms,
            MovieTicketType: mvtk.util.constants.TICKET_TYPE,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            VideoFormatType: chevre.factory.videoFormatType,
            SoundFormatType: chevre.factory.soundFormatType
        });
    }
);

priceSpecificationsRouter.all(
    '/:id/update',
    async (req, res) => {
        let message = '';
        let errors: any = {};

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
                    priceSpecification = { ...createMovieFromBody(req.body), id: priceSpecification.id };
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
            ...req.body
        };

        res.render('priceSpecifications/update', {
            message: message,
            errors: errors,
            forms: forms,
            MovieTicketType: mvtk.util.constants.TICKET_TYPE,
            PriceSpecificationType: chevre.factory.priceSpecificationType,
            VideoFormatType: chevre.factory.videoFormatType,
            SoundFormatType: chevre.factory.soundFormatType
        });
    }
);

function createMovieFromBody(body: any): chevre.factory.priceSpecification.IPriceSpecification<any> {
    return {
        typeOf: body.typeOf,
        price: Number(body.price),
        priceCurrency: chevre.factory.priceCurrency.JPY,
        appliesToVideoFormat: body.appliesToVideoFormat,
        appliesToSoundFormat: body.appliesToSoundFormat,
        appliesToMovieTicketType: body.appliesToMovieTicketType,
        valueAddedTaxIncluded: true
    };
}

function validate(req: Request): void {
    let colName: string = '';

    colName = '価格仕様タイプ';
    req.checkBody('typeOf', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}

export default priceSpecificationsRouter;
