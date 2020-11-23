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
 * カテゴリーコードルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const Message = require("../message");
const categoryCodeSet_1 = require("../factory/categoryCodeSet");
const categoryCodesRouter = express_1.Router();
categoryCodesRouter.get('', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('categoryCodes/index', {
        message: '',
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier,
        categoryCodeSets: categoryCodeSet_1.categoryCodeSets
    });
}));
categoryCodesRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield categoryCodeService.search(Object.assign(Object.assign({ limit: limit, page: page, project: { id: { $eq: req.project.id } }, inCodeSet: {
                identifier: {
                    $eq: (typeof ((_a = req.query.inCodeSet) === null || _a === void 0 ? void 0 : _a.identifier) === 'string' && req.query.inCodeSet.identifier.length > 0)
                        ? req.query.inCodeSet.identifier
                        : undefined,
                    $in: (Array.isArray((_c = (_b = req.query.inCodeSet) === null || _b === void 0 ? void 0 : _b.identifier) === null || _c === void 0 ? void 0 : _c.$in))
                        ? (_d = req.query.inCodeSet) === null || _d === void 0 ? void 0 : _d.identifier.$in : undefined
                }
            } }, (req.query.codeValue !== undefined && req.query.codeValue !== null
            && typeof req.query.codeValue.$eq === 'string' && req.query.codeValue.$eq.length > 0)
            ? { codeValue: { $eq: req.query.codeValue.$eq } }
            : undefined), (req.query.name !== undefined && req.query.name !== null
            && typeof req.query.name.$regex === 'string' && req.query.name.$regex.length > 0)
            ? { name: { $regex: req.query.name.$regex } }
            : undefined));
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((d) => {
                const categoryCodeSet = categoryCodeSet_1.categoryCodeSets.find((c) => c.identifier === d.inCodeSet.identifier);
                return Object.assign(Object.assign({}, d), { categoryCodeSetName: categoryCodeSet === null || categoryCodeSet === void 0 ? void 0 : categoryCodeSet.name });
            })
        });
    }
    catch (error) {
        res.json({
            success: false,
            message: error.message,
            count: 0,
            results: []
        });
    }
}));
categoryCodesRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                let categoryCode = createMovieFromBody(req);
                // コード重複確認
                const { data } = yield categoryCodeService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    codeValue: { $eq: categoryCode.codeValue },
                    inCodeSet: { identifier: { $eq: categoryCode.inCodeSet.identifier } }
                });
                if (data.length > 0) {
                    throw new Error('既に存在するコードです');
                }
                categoryCode = yield categoryCodeService.create(categoryCode);
                req.flash('message', '登録しました');
                res.redirect(`/categoryCodes/${categoryCode.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ appliesToCategoryCode: {} }, req.body);
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchProductsResult = yield productService.search({
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
        categoryCodeSets: categoryCodeSet_1.categoryCodeSets,
        paymentServices: searchProductsResult.data
    });
}));
// tslint:disable-next-line:use-default-type-parameter
categoryCodesRouter.all('/:id/update', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let categoryCode = yield categoryCodeService.findById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            // コンテンツDB登録
            try {
                categoryCode = Object.assign(Object.assign({}, createMovieFromBody(req)), { id: categoryCode.id });
                yield categoryCodeService.update(categoryCode);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign({}, categoryCode), req.body);
    const productService = new chevre.service.Product({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchProductsResult = yield productService.search({
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
        categoryCodeSets: categoryCodeSet_1.categoryCodeSets,
        paymentServices: searchProductsResult.data
    });
}));
categoryCodesRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const eventService = new chevre.service.Event({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCode = yield categoryCodeService.findById({ id: req.params.id });
        yield preDelete(req, categoryCode);
        yield categoryCodeService.deleteById({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        res.status(http_status_1.BAD_REQUEST)
            .json({ error: { message: error.message } });
    }
}));
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function preDelete(req, categoryCode) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // validation
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const priceSpecificationService = new chevre.service.PriceSpecification({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 関連する価格仕様
        const searchPriceSpecificationsResult = yield priceSpecificationService.search({
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
                const searchMoviesResult4contentRating = yield creativeWorkService.searchMovies({
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
                const searchMoviesResult4distributorType = yield creativeWorkService.searchMovies({
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
                const searchOffersResult4movieTicketType = yield offerService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    priceSpecification: {
                        appliesToMovieTicket: {
                            serviceType: { $eq: categoryCode.codeValue },
                            serviceOutput: { typeOf: { $eq: (_a = categoryCode.paymentMethod) === null || _a === void 0 ? void 0 : _a.typeOf } }
                        }
                    }
                });
                if (searchOffersResult4movieTicketType.data.length > 0) {
                    throw new Error('関連するオファーが存在します');
                }
                break;
            // オファーカテゴリー区分
            case chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType:
                const searchOffersResult = yield offerService.search({
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
                const searchSeatsResult = yield placeService.searchSeats({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    seatingType: { $eq: categoryCode.codeValue }
                });
                if (searchSeatsResult.data.length > 0) {
                    throw new Error('関連する座席が存在します');
                }
                const searchOffersResult4seatingType = yield offerService.search({
                    limit: 1,
                    project: { id: { $eq: req.project.id } },
                    eligibleSeatingType: {
                        codeValue: { $eq: categoryCode.codeValue }
                    }
                });
                if (searchOffersResult4seatingType.data.length > 0) {
                    throw new Error('関連するオファーが存在します');
                }
                break;
            // サービス区分
            case chevre.factory.categoryCode.CategorySetIdentifier.ServiceType:
                const searchOfferCatalogsResult = yield offerCatalogService.search({
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
                const searchEventsResult4soundFormatType = yield eventService.search({
                    limit: 1,
                    project: { ids: [req.project.id] },
                    typeOf: chevre.factory.eventType.ScreeningEventSeries,
                    soundFormat: { typeOf: { $eq: categoryCode.codeValue } }
                });
                if (searchEventsResult4soundFormatType.data.length > 0) {
                    throw new Error('関連する施設コンテンツが存在します');
                }
                break;
            // 上映方式区分
            case chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType:
                // 関連する施設コンテンツ
                const searchEventsResult4videoFormatType = yield eventService.search({
                    limit: 1,
                    project: { ids: [req.project.id] },
                    typeOf: chevre.factory.eventType.ScreeningEventSeries,
                    videoFormat: { typeOf: { $eq: categoryCode.codeValue } }
                });
                if (searchEventsResult4videoFormatType.data.length > 0) {
                    throw new Error('関連する施設コンテンツが存在します');
                }
                break;
            default:
        }
    });
}
function createMovieFromBody(req) {
    var _a;
    const paymentMethodType = (_a = req.body.paymentMethod) === null || _a === void 0 ? void 0 : _a.typeOf;
    return Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: 'CategoryCode', codeValue: req.body.codeValue, inCodeSet: {
            typeOf: 'CategoryCodeSet',
            identifier: req.body.inCodeSet.identifier
        }, name: { ja: req.body.name.ja } }, (req.body.inCodeSet.identifier === chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType)
        ? {
            paymentMethod: {
                typeOf: (typeof paymentMethodType === 'string' && paymentMethodType.length > 0)
                    ? paymentMethodType
                    // デフォルトはとりあえず固定でムビチケ
                    : chevre.factory.paymentMethodType.MovieTicket
            }
        }
        : undefined);
}
function validate() {
    return [
        express_validator_1.body('inCodeSet.identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '区分分類')),
        express_validator_1.body('codeValue')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            // .isAlphanumeric()
            .matches(/^[0-9a-zA-Z\+]+$/)
            .isLength({ max: 20 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('コード', 20)),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30)),
        express_validator_1.body('paymentMethod.typeOf')
            .if((_, { req }) => {
            var _a;
            return ((_a = req.body.inCodeSet) === null || _a === void 0 ? void 0 : _a.identifier) === chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType;
        })
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '決済方法'))
    ];
}
exports.default = categoryCodesRouter;
