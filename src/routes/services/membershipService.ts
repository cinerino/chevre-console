/**
 * 会員サービス管理ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as _ from 'underscore';

import * as Message from '../../common/Const/Message';

const NUM_ADDITIONAL_PROPERTY = 10;
const SERVICE_TYPE = 'MembershipService';

const membershipServiceRouter = Router();

membershipServiceRouter.all(
    '/new',
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const productService = new chevre.service.Product({
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
                try {
                    let product = createFromBody(req, true);
                    product = await productService.create(product);
                    req.flash('message', '登録しました');
                    res.redirect(`/services/membershipService/${product.id}`);

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
            itemOffered: { name: {} },
            seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit,
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        const searchOfferCatalogsResult = await offerCatalogService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            itemOffered: { typeOf: { $eq: SERVICE_TYPE } }
        });

        res.render('services/membershipService/new', {
            message: message,
            errors: errors,
            forms: forms,
            offerCatalogs: searchOfferCatalogsResult.data
        });
    }
);

membershipServiceRouter.get(
    '/search',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res) => {
        try {
            const productService = new chevre.service.Product({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const searchConditions = {
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                typeOf: { $eq: SERVICE_TYPE },
                serviceOutput: { typeOf: { $eq: chevre.factory.programMembership.ProgramMembershipType.ProgramMembership } }
            };
            const { data } = await productService.search(searchConditions);

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((t) => {
                    return {
                        ...t
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

membershipServiceRouter.all(
    '/:id',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            let message = '';
            let errors: any = {};

            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const productService = new chevre.service.Product({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            let product = await productService.findById({ id: req.params.id });

            if (req.method === 'POST') {
                // 検証
                validate(req);
                const validatorResult = await req.getValidationResult();
                errors = req.validationErrors(true);
                if (validatorResult.isEmpty()) {
                    try {
                        product = createFromBody(req, false);
                        await productService.update(product);
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);

                        return;
                    } catch (error) {
                        message = error.message;
                    }
                }
            } else if (req.method === 'DELETE') {
                await productService.deleteById({ id: req.params.id });
                res.status(NO_CONTENT)
                    .end();

                return;
            }

            const forms = {
                ...product
            };

            const searchOfferCatalogsResult = await offerCatalogService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                itemOffered: { typeOf: { $eq: SERVICE_TYPE } }
            });

            res.render('services/membershipService/update', {
                message: message,
                errors: errors,
                forms: forms,
                offerCatalogs: searchOfferCatalogsResult.data
            });
        } catch (err) {
            next(err);
        }
    }
);

membershipServiceRouter.get(
    '',
    async (__, res) => {
        res.render('services/membershipService/index', {
            message: ''
        });
    }
);

function createFromBody(req: Request, isNew: boolean): any {
    const body = req.body;

    let hasOfferCatalog: any;
    if (typeof body.hasOfferCatalog?.id === 'string' && body.hasOfferCatalog?.id.length > 0) {
        hasOfferCatalog = {
            typeOf: 'OfferCatalog',
            id: body.hasOfferCatalog?.id
        };
    }

    return {
        project: req.project,
        typeOf: SERVICE_TYPE,
        id: req.params.id,
        // identifier: body.identifier,
        name: body.name,
        ...(hasOfferCatalog !== undefined) ? { hasOfferCatalog } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(hasOfferCatalog === undefined) ? { hasOfferCatalog: 1 } : undefined
                }
            }
            : undefined
    };
}

function validate(req: Request): void {
    let colName: string = '';

    // colName = '区分分類';
    // req.checkBody('inCodeSet.identifier').notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName));

    // colName = '区分コード';
    // req.checkBody('codeValue')
    //     .notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName))
    //     .isAlphanumeric()
    //     .len({ max: 20 })
    //     // tslint:disable-next-line:no-magic-numbers
    //     .withMessage(Message.Common.getMaxLength(colName, 20));

    colName = '名称';
    req.checkBody('name.ja').notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        // tslint:disable-next-line:no-magic-numbers
        .withMessage(Message.Common.getMaxLength(colName, 30));
}

export default membershipServiceRouter;
