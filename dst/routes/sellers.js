"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 販売者ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Message = require("../message");
const NUM_ADDITIONAL_PROPERTY = 10;
// コード 半角64
const NAME_MAX_LENGTH_CODE = 30;
// 名称・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
const sellersRouter = express_1.Router();
sellersRouter.all('/add', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const sellerService = new chevre.service.Seller({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // 検証
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        // 検証
        if (validatorResult.isEmpty()) {
            // 登録プロセス
            try {
                req.body.id = '';
                let seller = yield createFromBody(req, true);
                seller = yield sellerService.create(seller);
                req.flash('message', '登録しました');
                res.redirect(`/sellers/${seller.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [], name: {}, alternateName: {} }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('sellers/add', {
        message: message,
        errors: errors,
        forms: forms,
        OrganizationType: chevre.factory.organizationType
    });
}));
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.all('/:id/update', ...validate(), 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const sellerService = new chevre.service.Seller({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        let seller = yield sellerService.findById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            // 検証
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = req.params.id;
                    seller = yield createFromBody(req, false);
                    yield sellerService.update({ id: seller.id, attributes: seller });
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    console.error(error);
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign({}, seller), req.body);
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }
        res.render('sellers/update', {
            message: message,
            errors: errors,
            forms: forms,
            OrganizationType: chevre.factory.organizationType
        });
    }
    catch (error) {
        next(error);
    }
}));
sellersRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('sellers/index', {
        message: ''
    });
}));
sellersRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerService = new chevre.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        // const identifierRegex = req.query.identifier;
        const searchConditions = {
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            name: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
        };
        let data;
        const searchResult = yield sellerService.search(searchConditions);
        data = searchResult.data;
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((t) => {
                return Object.assign(Object.assign({}, t), { paymentAcceptedCount: (Array.isArray(t.paymentAccepted))
                        ? t.paymentAccepted.length
                        : 0, hasMerchantReturnPolicyCount: (Array.isArray(t.hasMerchantReturnPolicy))
                        ? t.hasMerchantReturnPolicy.length
                        : 0 });
            })
        });
    }
    catch (err) {
        res.json({
            success: false,
            message: err.message,
            count: 0,
            results: []
        });
    }
}));
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req, isNew) {
    return __awaiter(this, void 0, void 0, function* () {
        let nameFromJson = {};
        if (typeof req.body.nameStr === 'string' && req.body.nameStr.length > 0) {
            try {
                nameFromJson = JSON.parse(req.body.nameStr);
            }
            catch (error) {
                throw new Error(`高度な名称の型が不適切です ${error.message}`);
            }
        }
        let hasMerchantReturnPolicy;
        if (typeof req.body.hasMerchantReturnPolicyStr === 'string' && req.body.hasMerchantReturnPolicyStr.length > 0) {
            try {
                hasMerchantReturnPolicy = JSON.parse(req.body.hasMerchantReturnPolicyStr);
            }
            catch (error) {
                throw new Error(`返品ポリシーの型が不適切です ${error.message}`);
            }
        }
        let paymentAccepted;
        if (typeof req.body.paymentAcceptedStr === 'string' && req.body.paymentAcceptedStr.length > 0) {
            try {
                paymentAccepted = JSON.parse(req.body.paymentAcceptedStr);
            }
            catch (error) {
                throw new Error(`対応決済方法の型が不適切です ${error.message}`);
            }
        }
        let makesOffer;
        if (typeof req.body.makesOfferStr === 'string' && req.body.makesOfferStr.length > 0) {
            try {
                makesOffer = JSON.parse(req.body.makesOfferStr);
            }
            catch (error) {
                throw new Error(`オファーの型が不適切です ${error.message}`);
            }
        }
        let parentOrganization;
        if (typeof req.body.parentOrganizationStr === 'string' && req.body.parentOrganizationStr.length > 0) {
            try {
                parentOrganization = JSON.parse(req.body.parentOrganizationStr);
            }
            catch (error) {
                throw new Error(`親組織の型が不適切です ${error.message}`);
            }
        }
        const identifier = req.body.identifier;
        const telephone = req.body.telephone;
        const url = req.body.url;
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: req.body.typeOf, id: req.body.id, name: Object.assign(Object.assign({}, nameFromJson), { ja: req.body.name.ja, en: req.body.name.en }), additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined, areaServed: [] }, {
            hasPOS: []
        }), (typeof identifier === 'string' && identifier.length > 0) ? { identifier } : undefined), (typeof telephone === 'string' && telephone.length > 0) ? { telephone } : undefined), (typeof url === 'string' && url.length > 0) ? { url } : undefined), (hasMerchantReturnPolicy !== undefined) ? { hasMerchantReturnPolicy } : undefined), (makesOffer !== undefined) ? { makesOffer } : undefined), (paymentAccepted !== undefined) ? { paymentAccepted } : undefined), (parentOrganization !== undefined) ? { parentOrganization } : undefined), (!isNew)
            ? {
                $unset: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (typeof identifier !== 'string' || identifier.length === 0) ? { identifier: 1 } : undefined), (typeof telephone !== 'string' || telephone.length === 0) ? { telephone: 1 } : undefined), (typeof url !== 'string' || url.length === 0) ? { url: 1 } : undefined), (hasMerchantReturnPolicy === undefined) ? { hasMerchantReturnPolicy: 1 } : undefined), (makesOffer === undefined) ? { makesOffer: 1 } : undefined), (paymentAccepted === undefined) ? { paymentAccepted: 1 } : undefined), (parentOrganization === undefined) ? { parentOrganization: 1 } : undefined)
            }
            : undefined);
    });
}
function validate() {
    return [
        // body('identifier', Message.Common.required.replace('$fieldName$', 'コード'))
        //     .notEmpty()
        //     .isLength({ max: NAME_MAX_LENGTH_CODE })
        //     .withMessage(Message.Common.getMaxLengthHalfByte('コード', NAME_MAX_LENGTH_CODE))
        //     .matches(/^[0-9a-zA-Z\-_]+$/)
        //     .withMessage(() => '英数字で入力してください'),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA })
            .withMessage(Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_CODE))
    ];
}
exports.default = sellersRouter;
