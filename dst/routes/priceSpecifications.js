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
    // ムビチケ券種区分検索
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
                // const mvtkType = mvtk.util.constants.TICKET_TYPE.find((t) => t.code === (<any>d).appliesToMovieTicketType);
                const appliesToCategoryCode = (Array.isArray(d.appliesToCategoryCode))
                    ? d.appliesToCategoryCode[0] :
                    undefined;
                const categoryCodeSet = categoryCodeSet_1.categoryCodeSets.find((c) => { var _a; return c.identifier === ((_a = appliesToCategoryCode === null || appliesToCategoryCode === void 0 ? void 0 : appliesToCategoryCode.inCodeSet) === null || _a === void 0 ? void 0 : _a.identifier); });
                const priceSpecificationType = priceSpecificationType_1.priceSpecificationTypes.find((p) => p.codeValue === d.typeOf);
                return Object.assign(Object.assign({}, d), { priceSpecificationTypeName: priceSpecificationType === null || priceSpecificationType === void 0 ? void 0 : priceSpecificationType.name, appliesToCategoryCodeSetName: categoryCodeSet === null || categoryCodeSet === void 0 ? void 0 : categoryCodeSet.name, appliesToCategoryCode: appliesToCategoryCode, appliesToMovieTicket: {
                        name: ''
                    } });
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
priceSpecificationsRouter.all('/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    // ムビチケ券種区分検索
    const searchMovieTicketTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType } }
    });
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
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
priceSpecificationsRouter.all('/:id/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    // ムビチケ券種区分検索
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
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
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
    const body = req.body;
    let appliesToCategoryCode;
    let appliesToVideoFormat;
    let appliesToMovieTicketType;
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
    return Object.assign(Object.assign(Object.assign(Object.assign({ project: req.project, typeOf: body.typeOf, price: Number(body.price), priceCurrency: chevre.factory.priceCurrency.JPY, name: body.name, valueAddedTaxIncluded: true }, (appliesToCategoryCode !== undefined)
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
        : undefined), (typeof appliesToVideoFormat === 'string' && appliesToVideoFormat.length > 0)
        ? { appliesToVideoFormat: body.appliesToVideoFormat }
        : undefined), (typeof appliesToMovieTicketType === 'string' && appliesToMovieTicketType.length > 0)
        ? { appliesToMovieTicketType: body.appliesToMovieTicketType }
        : undefined), (!isNew)
        ? {
            $unset: Object.assign(Object.assign(Object.assign({}, (appliesToCategoryCode === undefined)
                ? { appliesToCategoryCode: 1 }
                : undefined), (appliesToVideoFormat === undefined)
                ? { appliesToVideoFormat: 1 }
                : undefined), (appliesToMovieTicketType === undefined)
                ? { appliesToMovieTicketType: 1 }
                : undefined)
        } : undefined);
}
function validate(req) {
    let colName = '';
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
exports.default = priceSpecificationsRouter;
