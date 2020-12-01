/**
 * 販売者ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as _ from 'underscore';

import * as Message from '../message';

const NUM_ADDITIONAL_PROPERTY = 10;

// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME = 64;

const sellersRouter = Router();

sellersRouter.all<any>(
    '/new',
    ...validate(),
    async (req, res) => {
        let message = '';
        let errors: any = {};

        const sellerService = new chevre.service.Seller({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        if (req.method === 'POST') {
            // 検証
            const validatorResult = validationResult(req);
            errors = validatorResult.mapped();
            // 検証
            if (validatorResult.isEmpty()) {
                // 登録プロセス
                try {
                    req.body.id = '';
                    let seller = await createFromBody(req, true);

                    seller = await sellerService.create(seller);
                    req.flash('message', '登録しました');
                    res.redirect(`/sellers/${seller.id}/update`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }

        const forms = {
            additionalProperty: [],
            paymentAccepted: [],
            name: {},
            alternateName: {},
            ...req.body
        };
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }

        if (req.method === 'POST') {
            // 対応決済方法を補完
            if (Array.isArray(req.body.paymentAccepted) && req.body.paymentAccepted.length > 0) {
                forms.paymentAccepted = (<string[]>req.body.paymentAccepted).map((v) => JSON.parse(v));
            } else {
                forms.paymentAccepted = [];
            }
        }

        res.render('sellers/new', {
            message: message,
            errors: errors,
            forms: forms,
            OrganizationType: chevre.factory.organizationType
        });
    }
);

sellersRouter.delete(
    '/:id',
    async (req, res) => {
        try {
            const sellerService = new chevre.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            await sellerService.deleteById({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            res.status(BAD_REQUEST)
                .json({ error: { message: error.message } });
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
sellersRouter.all<ParamsDictionary>(
    '/:id/update',
    ...validate(),
    async (req, res, next) => {
        let message = '';
        let errors: any = {};

        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const sellerService = new chevre.service.Seller({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        try {
            let seller = await sellerService.findById({ id: req.params.id });

            if (req.method === 'POST') {
                // 検証
                const validatorResult = validationResult(req);
                errors = validatorResult.mapped();

                // 検証
                if (validatorResult.isEmpty()) {
                    try {
                        req.body.id = req.params.id;
                        seller = await createFromBody(req, false);
                        await sellerService.update({ id: String(seller.id), attributes: seller });
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);

                        return;
                    } catch (error) {
                        message = error.message;
                    }
                }
            }

            const forms = {
                paymentAccepted: [],
                ...seller,
                ...req.body
            };
            if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
                // tslint:disable-next-line:prefer-array-literal
                forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                    return {};
                }));
            }

            if (req.method === 'POST') {
                // 対応決済方法を補完
                if (Array.isArray(req.body.paymentAccepted) && req.body.paymentAccepted.length > 0) {
                    forms.paymentAccepted = (<string[]>req.body.paymentAccepted).map((v) => JSON.parse(v));
                } else {
                    forms.paymentAccepted = [];
                }
            } else {
                if (Array.isArray(seller.paymentAccepted) && seller.paymentAccepted.length > 0) {
                    const searchPaymentMethodTypesResult = await categoryCodeService.search({
                        limit: 100,
                        project: { id: { $eq: req.project.id } },
                        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.PaymentMethodType } },
                        codeValue: { $in: seller.paymentAccepted.map((v) => v.paymentMethodType) }
                    });
                    forms.paymentAccepted = searchPaymentMethodTypesResult.data.map((c) => {
                        return { codeValue: c.codeValue, name: c.name };
                    });
                } else {
                    forms.paymentAccepted = [];
                }
            }

            res.render('sellers/update', {
                message: message,
                errors: errors,
                forms: forms,
                OrganizationType: chevre.factory.organizationType
            });
        } catch (error) {
            next(error);
        }
    }
);

sellersRouter.get(
    '',
    async (__, res) => {
        res.render('sellers/index', {
            message: ''
        });
    }
);

sellersRouter.get(
    '/getlist',
    async (req, res) => {
        try {
            const sellerService = new chevre.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page);

            const searchConditions: chevre.factory.seller.ISearchConditions = {
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                name: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
            };

            let data: chevre.factory.seller.ISeller[];
            const searchResult = await sellerService.search(searchConditions);
            data = searchResult.data;

            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((t) => {
                    return {
                        ...t,
                        paymentAcceptedCount: (Array.isArray(t.paymentAccepted))
                            ? t.paymentAccepted.length
                            : 0,
                        hasMerchantReturnPolicyCount: (Array.isArray(t.hasMerchantReturnPolicy))
                            ? t.hasMerchantReturnPolicy.length
                            : 0
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

// tslint:disable-next-line:cyclomatic-complexity
async function createFromBody(
    req: Request, isNew: boolean
): Promise<chevre.factory.seller.ISeller> {
    let nameFromJson: any = {};
    if (typeof req.body.nameStr === 'string' && req.body.nameStr.length > 0) {
        try {
            nameFromJson = JSON.parse(req.body.nameStr);
        } catch (error) {
            throw new Error(`高度な名称の型が不適切です ${error.message}`);
        }
    }

    let hasMerchantReturnPolicy: chevre.factory.organization.IHasMerchantReturnPolicy | undefined;
    if (typeof req.body.hasMerchantReturnPolicyStr === 'string' && req.body.hasMerchantReturnPolicyStr.length > 0) {
        try {
            hasMerchantReturnPolicy = JSON.parse(req.body.hasMerchantReturnPolicyStr);
        } catch (error) {
            throw new Error(`返品ポリシーの型が不適切です ${error.message}`);
        }
    }

    let paymentAccepted: chevre.factory.seller.IPaymentAccepted[] | undefined;
    if (Array.isArray(req.body.paymentAccepted) && req.body.paymentAccepted.length > 0) {
        try {
            paymentAccepted = (<any[]>req.body.paymentAccepted).map((p) => {
                const selectedPaymentMethod = JSON.parse(p);

                return { paymentMethodType: selectedPaymentMethod.codeValue };
            });
        } catch (error) {
            throw new Error(`対応決済方法の型が不適切です ${error.message}`);
        }
    }

    // 親組織のデフォルトはCinerinoプロジェクトの親組織
    let parentOrganization: chevre.factory.organization.IParentOrganization | undefined;
    if (typeof req.body.parentOrganizationStr === 'string' && req.body.parentOrganizationStr.length > 0) {
        try {
            parentOrganization = JSON.parse(req.body.parentOrganizationStr);
        } catch (error) {
            throw new Error(`親組織の型が不適切です ${error.message}`);
        }
    }

    const branchCode: string | undefined = req.body.branchCode;
    const telephone: string | undefined = req.body.telephone;
    const url: string | undefined = req.body.url;

    return {
        project: { typeOf: req.project.typeOf, id: req.project.id },
        typeOf: req.body.typeOf,
        id: req.body.id,
        name: {
            ...nameFromJson,
            ja: req.body.name.ja,
            en: req.body.name.en
        },
        additionalProperty: (Array.isArray(req.body.additionalProperty))
            ? req.body.additionalProperty.filter((p: any) => typeof p.name === 'string' && p.name !== '')
                .map((p: any) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
            : undefined,
        areaServed: [],
        ...(typeof branchCode === 'string' && branchCode.length > 0) ? { branchCode } : undefined,
        ...(typeof telephone === 'string' && telephone.length > 0) ? { telephone } : undefined,
        ...(typeof url === 'string' && url.length > 0) ? { url } : undefined,
        ...(hasMerchantReturnPolicy !== undefined) ? { hasMerchantReturnPolicy } : undefined,
        ...(paymentAccepted !== undefined) ? { paymentAccepted } : undefined,
        ...(parentOrganization !== undefined) ? { parentOrganization } : undefined,
        ...(!isNew)
            ? {
                $unset: {
                    ...(typeof telephone !== 'string' || telephone.length === 0) ? { telephone: 1 } : undefined,
                    ...(typeof url !== 'string' || url.length === 0) ? { url: 1 } : undefined,
                    ...(hasMerchantReturnPolicy === undefined) ? { hasMerchantReturnPolicy: 1 } : undefined,
                    ...(paymentAccepted === undefined) ? { paymentAccepted: 1 } : undefined,
                    ...(parentOrganization === undefined) ? { parentOrganization: 1 } : undefined
                }
            }
            : undefined
    };
}

function validate() {
    return [
        body('branchCode')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .matches(/^[0-9a-zA-Z]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('コード', 20)),

        body('typeOf')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'タイプ')),

        body(['name.ja', 'name.en'])
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: NAME_MAX_LENGTH_NAME })
            .withMessage(Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_NAME))
    ];
}

export default sellersRouter;
