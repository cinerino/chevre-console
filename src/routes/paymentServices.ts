/**
 * 決済サービスルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../message';

import { paymentServiceTypes } from '../factory/paymentServiceType';

const NUM_ADDITIONAL_PROPERTY = 10;

const paymentServicesRouter = Router();

paymentServicesRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const productService = new chevre.service.Product({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // 検証
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            // 検証
            if (validatorResult.isEmpty()) {
                try {
                    let product = createFromBody(req, true);

                    // プロダクトID重複確認
                    const searchProductsResult = await productService.search({
                        limit: 1,
                        project: { id: { $eq: req.project.id } },
                        productID: { $eq: product.productID }
                    });
                    if (searchProductsResult.data.length > 0) {
                        throw new Error('既に存在するプロダクトIDです');
                    }

                    product = await productService.create(product);
                    req.flash('message', '登録しました');
                    res.redirect(`/paymentServices/${product.id}`);

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
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        const sellerService = new chevre.service.Seller({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchSellersResult = await sellerService.search({ project: { id: { $eq: req.project.id } } });

        res.render('paymentServices/new', {
            message: message,
            errors: errors,
            forms: forms,
            paymentServiceTypes: paymentServiceTypes,
            sellers: searchSellersResult.data
        });
    }
);

paymentServicesRouter.get(
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
            const searchConditions: chevre.factory.product.ISearchConditions = {
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                typeOf: (typeof req.query.typeOf?.$eq === 'string' && req.query.typeOf.$eq.length > 0)
                    ? { $eq: req.query.typeOf.$eq }
                    : <any>{
                        $in: [
                            chevre.factory.service.paymentService.PaymentServiceType.CreditCard,
                            chevre.factory.service.paymentService.PaymentServiceType.MovieTicket
                        ]
                    }
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

// tslint:disable-next-line:use-default-type-parameter
paymentServicesRouter.all<ParamsDictionary>(
    '/:id',
    ...validate(),
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            let message = '';
            let errors: any = {};

            const productService = new chevre.service.Product({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            let product = await productService.findById({ id: req.params.id });

            if (req.method === 'POST') {
                // 検証
                const validatorResult = validationResult(req);
                errors = validatorResult.mapped();
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
                ...product,
                offersValidFrom: (Array.isArray(product.offers) && product.offers.length > 0 && product.offers[0].validFrom !== undefined)
                    ? moment(product.offers[0].validFrom)
                        // .add(-1, 'day')
                        .tz('Asia/Tokyo')
                        .format('YYYY/MM/DD')
                    : '',
                offersValidThrough: (Array.isArray(product.offers)
                    && product.offers.length > 0
                    && product.offers[0].validThrough !== undefined)
                    ? moment(product.offers[0].validThrough)
                        .add(-1, 'day')
                        .tz('Asia/Tokyo')
                        .format('YYYY/MM/DD')
                    : ''
            };

            const sellerService = new chevre.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchSellersResult = await sellerService.search({ project: { id: { $eq: req.project.id } } });

            res.render('paymentServices/update', {
                message: message,
                errors: errors,
                forms: forms,
                paymentServiceTypes: paymentServiceTypes,
                sellers: searchSellersResult.data
            });
        } catch (err) {
            next(err);
        }
    }
);

paymentServicesRouter.get(
    '',
    async (req, res) => {
        const sellerService = new chevre.service.Seller({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchSellersResult = await sellerService.search({ project: { id: { $eq: req.project.id } } });

        res.render('paymentServices/index', {
            message: '',
            paymentServiceTypes: paymentServiceTypes,
            sellers: searchSellersResult.data
        });
    }
);

// tslint:disable-next-line:cyclomatic-complexity
function createFromBody(req: Request, isNew: boolean): chevre.factory.product.IProduct {
    let availableChannel: chevre.factory.service.paymentService.IAvailableChannel | undefined;
    if (typeof req.body.availableChannelStr === 'string' && req.body.availableChannelStr.length > 0) {
        try {
            availableChannel = JSON.parse(req.body.availableChannelStr);
        } catch (error) {
            throw new Error(`invalid offers ${error.message}`);
        }
    }

    let serviceOutput: chevre.factory.product.IServiceOutput | chevre.factory.product.IServiceOutput | undefined;
    if (typeof req.body.serviceOutputStr === 'string' && req.body.serviceOutputStr.length > 0) {
        try {
            serviceOutput = JSON.parse(req.body.serviceOutputStr);
        } catch (error) {
            throw new Error(`invalid serviceOutput ${error.message}`);
        }
    }

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: req.body.typeOf,
        id: req.params.id,
        productID: req.body.productID,
        name: req.body.name,
        ...(availableChannel !== undefined) ? { availableChannel } : undefined,
        ...(serviceOutput !== undefined) ? { serviceOutput } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(availableChannel === undefined) ? { availableChannel: 1 } : undefined,
                    ...(serviceOutput === undefined) ? { serviceOutput: 1 } : undefined
                }
            }
            : undefined
    };
}

function validate() {
    return [
        body('typeOf')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'プロダクトタイプ')),

        body('productID')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'プロダクトID'))
            .matches(/^[0-9a-zA-Z]+$/)
            // tslint:disable-next-line:no-magic-numbers
            .isLength({ max: 30 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('プロダクトID', 30)),

        body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .isLength({ max: 30 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30))
    ];
}

export default paymentServicesRouter;
