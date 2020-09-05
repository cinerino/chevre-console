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
 * 価格仕様ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Message = require("../message");
const categoryCodeSet_1 = require("../factory/categoryCodeSet");
const priceSpecificationType_1 = require("../factory/priceSpecificationType");
const priceSpecificationsRouter = express_1.Router();
priceSpecificationsRouter.get('', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    // 上映方式タイプ検索
    const searchVideoFormatTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
    });
    // 上映方式タイプ検索
    const searchSoundFormatFormatTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType } }
    });
    // 座席区分検索
    const searchSeatingTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
    });
    // 決済カード(ムビチケ券種)区分検索
    const searchMovieTicketTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
    });
    res.render('priceSpecifications/index', {
        message: '',
        movieTicketTypes: searchMovieTicketTypesResult.data,
        PriceSpecificationType: chevre.factory.priceSpecificationType,
        priceSpecificationTypes: priceSpecificationType_1.priceSpecificationTypes,
        videoFormatTypes: searchVideoFormatTypesResult.data,
        soundFormatTypes: searchSoundFormatFormatTypesResult.data,
        seatingTypes: searchSeatingTypesResult.data,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
    });
}));
priceSpecificationsRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const priceSpecificationService = new chevre.service.PriceSpecification({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield priceSpecificationService.search({
            limit: limit,
            page: page,
            sort: { price: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] },
            typeOf: (req.query.typeOf !== '') ? req.query.typeOf : undefined,
            appliesToMovieTicket: {
                serviceTypes: (req.query.appliesToMovieTicketType !== '') ? [req.query.appliesToMovieTicketType] : undefined
            },
            appliesToCategoryCode: Object.assign({}, (typeof req.query.appliesToCategoryCode === 'string' && req.query.appliesToCategoryCode.length > 0)
                ? {
                    $elemMatch: {
                        codeValue: { $eq: JSON.parse(req.query.appliesToCategoryCode).codeValue },
                        'inCodeSet.identifier': { $eq: JSON.parse(req.query.appliesToCategoryCode).inCodeSet.identifier }
                    }
                }
                : {})
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((d) => {
                const appliesToCategoryCode = (Array.isArray(d.appliesToCategoryCode))
                    ? d.appliesToCategoryCode[0] :
                    undefined;
                const categoryCodeSet = categoryCodeSet_1.categoryCodeSets.find((c) => { var _a; return c.identifier === ((_a = appliesToCategoryCode === null || appliesToCategoryCode === void 0 ? void 0 : appliesToCategoryCode.inCodeSet) === null || _a === void 0 ? void 0 : _a.identifier); });
                const priceSpecificationType = priceSpecificationType_1.priceSpecificationTypes.find((p) => p.codeValue === d.typeOf);
                return Object.assign(Object.assign({}, d), { priceSpecificationTypeName: priceSpecificationType === null || priceSpecificationType === void 0 ? void 0 : priceSpecificationType.name, appliesToCategoryCodeSetName: categoryCodeSet === null || categoryCodeSet === void 0 ? void 0 : categoryCodeSet.name, appliesToCategoryCode: appliesToCategoryCode });
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
priceSpecificationsRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    // 上映方式タイプ検索
    const searchVideoFormatTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
    });
    // 上映方式タイプ検索
    const searchSoundFormatFormatTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType } }
    });
    // 座席区分検索
    const searchSeatingTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
    });
    // 決済カード(ムビチケ券種)区分検索
    const searchMovieTicketTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            try {
                let priceSpecification = createMovieFromBody(req, true);
                const priceSpecificationService = new chevre.service.PriceSpecification({
                    endpoint: process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                priceSpecification = yield priceSpecificationService.create(priceSpecification);
                req.flash('message', '登録しました');
                res.redirect(`/priceSpecifications/${priceSpecification.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ appliesToCategoryCode: {} }, req.body);
    res.render('priceSpecifications/new', {
        message: message,
        errors: errors,
        forms: forms,
        movieTicketTypes: searchMovieTicketTypesResult.data,
        PriceSpecificationType: chevre.factory.priceSpecificationType,
        priceSpecificationTypes: priceSpecificationType_1.priceSpecificationTypes,
        videoFormatTypes: searchVideoFormatTypesResult.data,
        soundFormatTypes: searchSoundFormatFormatTypesResult.data,
        seatingTypes: searchSeatingTypesResult.data,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
    });
}));
// tslint:disable-next-line:use-default-type-parameter
priceSpecificationsRouter.all('/:id/update', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    // 上映方式タイプ検索
    const searchVideoFormatTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType } }
    });
    // 上映方式タイプ検索
    const searchSoundFormatFormatTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType } }
    });
    // 座席区分検索
    const searchSeatingTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType } }
    });
    // 決済カード(ムビチケ券種)区分検索
    const searchMovieTicketTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
    });
    const priceSpecificationService = new chevre.service.PriceSpecification({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let priceSpecification = yield priceSpecificationService.findById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        if (validatorResult.isEmpty()) {
            // コンテンツDB登録
            try {
                priceSpecification = Object.assign(Object.assign({}, createMovieFromBody(req, false)), { id: priceSpecification.id });
                yield priceSpecificationService.update(priceSpecification);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign({}, priceSpecification), (Array.isArray(priceSpecification.appliesToCategoryCode)
        && priceSpecification.appliesToCategoryCode.length > 0)
        ? { appliesToCategoryCode: priceSpecification.appliesToCategoryCode[0] }
        : { appliesToCategoryCode: {} }
    // ...req.body
    );
    res.render('priceSpecifications/update', {
        message: message,
        errors: errors,
        forms: forms,
        movieTicketTypes: searchMovieTicketTypesResult.data,
        PriceSpecificationType: chevre.factory.priceSpecificationType,
        priceSpecificationTypes: priceSpecificationType_1.priceSpecificationTypes,
        videoFormatTypes: searchVideoFormatTypesResult.data,
        soundFormatTypes: searchSoundFormatFormatTypesResult.data,
        seatingTypes: searchSeatingTypesResult.data,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
    });
}));
function createMovieFromBody(req, isNew) {
    var _a, _b, _c;
    let appliesToCategoryCode;
    let appliesToVideoFormat;
    let appliesToMovieTicketType;
    let appliesToMovieTicketServiceOutputTypeOf;
    switch (req.body.typeOf) {
        case chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification:
            appliesToCategoryCode =
                (typeof req.body.appliesToCategoryCode === 'string' && req.body.appliesToCategoryCode.length > 0)
                    ? JSON.parse(req.body.appliesToCategoryCode)
                    : undefined;
            appliesToVideoFormat = undefined;
            break;
        case chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification:
            appliesToCategoryCode = undefined;
            appliesToVideoFormat = req.body.appliesToVideoFormat;
            appliesToMovieTicketType = (_a = req.body.appliesToMovieTicket) === null || _a === void 0 ? void 0 : _a.serviceType;
            appliesToMovieTicketServiceOutputTypeOf = (_c = (_b = req.body.appliesToMovieTicket) === null || _b === void 0 ? void 0 : _b.serviceOutput) === null || _c === void 0 ? void 0 : _c.typeOf;
            break;
        default:
    }
    return Object.assign(Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: req.body.typeOf, price: Number(req.body.price), priceCurrency: chevre.factory.priceCurrency.JPY, name: req.body.name, valueAddedTaxIncluded: true }, (appliesToCategoryCode !== undefined)
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
        : undefined), (typeof appliesToVideoFormat === 'string' && appliesToVideoFormat.length > 0)
        ? { appliesToVideoFormat: req.body.appliesToVideoFormat }
        : undefined), (typeof appliesToMovieTicketType === 'string' && appliesToMovieTicketType.length > 0)
        ? {
            appliesToMovieTicket: {
                typeOf: chevre.factory.service.paymentService.PaymentServiceType.MovieTicket,
                serviceType: appliesToMovieTicketType,
                serviceOutput: {
                    // とりあえず決済方法は固定でムビチケ
                    typeOf: appliesToMovieTicketServiceOutputTypeOf
                }
            },
            // 互換性維持対応
            appliesToMovieTicketType: appliesToMovieTicketType
        }
        : undefined), (!isNew)
        ? {
            $unset: Object.assign(Object.assign(Object.assign({}, (appliesToCategoryCode === undefined)
                ? { appliesToCategoryCode: 1 }
                : undefined), (appliesToVideoFormat === undefined)
                ? { appliesToVideoFormat: 1 }
                : undefined), (typeof appliesToMovieTicketType !== 'string' || appliesToMovieTicketType.length === 0)
                ? { appliesToMovieTicketType: 1, appliesToMovieTicket: 1 }
                : undefined)
        } : undefined);
}
function validate() {
    return [
        express_validator_1.body('typeOf')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '価格仕様タイプ')),
        express_validator_1.body('name.ja')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 30)),
        express_validator_1.body('price')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '金額'))
            .isInt()
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(() => '数値を入力してください'),
        express_validator_1.body('appliesToCategoryCode')
            .if((_, { req }) => req.body.typeOf === chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification)
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '適用区分')),
        express_validator_1.body('appliesToMovieTicket.serviceType')
            .if((_, { req }) => req.body.typeOf === chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification)
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '適用決済カード(ムビチケ券種)区分')),
        express_validator_1.body('appliesToVideoFormat')
            .if((_, { req }) => req.body.typeOf === chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification)
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'ムビチケ適用上映方式区分'))
    ];
}
exports.default = priceSpecificationsRouter;
