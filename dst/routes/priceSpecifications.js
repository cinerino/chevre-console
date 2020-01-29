"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 価格仕様ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const reserve_api_abstract_client_1 = require("@movieticket/reserve-api-abstract-client");
const express_1 = require("express");
const Message = require("../common/Const/Message");
const priceSpecificationsRouter = express_1.Router();
priceSpecificationsRouter.get('', (_, res) => __awaiter(this, void 0, void 0, function* () {
    res.render('priceSpecifications/index', {
        message: '',
        MovieTicketType: reserve_api_abstract_client_1.mvtk.util.constants.TICKET_TYPE,
        PriceSpecificationType: chevre.factory.priceSpecificationType,
        VideoFormatType: chevre.factory.videoFormatType,
        SoundFormatType: chevre.factory.soundFormatType,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
    });
}));
priceSpecificationsRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
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
                const mvtkType = reserve_api_abstract_client_1.mvtk.util.constants.TICKET_TYPE.find((t) => t.code === d.appliesToMovieTicketType);
                return Object.assign({}, d, { appliesToCategoryCode: (Array.isArray(d.appliesToCategoryCode))
                        ? d.appliesToCategoryCode[0] :
                        undefined, appliesToMovieTicket: {
                        name: (d.appliesToMovieTicketType !== undefined && mvtkType !== undefined)
                            ? mvtkType.name
                            : undefined
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
priceSpecificationsRouter.all('/new', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        console.error(errors);
        if (validatorResult.isEmpty()) {
            try {
                let priceSpecification = createMovieFromBody(req);
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
        MovieTicketType: reserve_api_abstract_client_1.mvtk.util.constants.TICKET_TYPE,
        PriceSpecificationType: chevre.factory.priceSpecificationType,
        VideoFormatType: chevre.factory.videoFormatType,
        SoundFormatType: chevre.factory.soundFormatType,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
    });
}));
priceSpecificationsRouter.all('/:id/update', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
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
                priceSpecification = Object.assign({}, createMovieFromBody(req), { id: priceSpecification.id });
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
    const forms = Object.assign({}, priceSpecification, (Array.isArray(priceSpecification.appliesToCategoryCode)
        && priceSpecification.appliesToCategoryCode.length > 0)
        ? { appliesToCategoryCode: priceSpecification.appliesToCategoryCode[0] }
        : { appliesToCategoryCode: {} }
    // ...req.body
    );
    res.render('priceSpecifications/update', {
        message: message,
        errors: errors,
        forms: forms,
        MovieTicketType: reserve_api_abstract_client_1.mvtk.util.constants.TICKET_TYPE,
        PriceSpecificationType: chevre.factory.priceSpecificationType,
        VideoFormatType: chevre.factory.videoFormatType,
        SoundFormatType: chevre.factory.soundFormatType,
        CategorySetIdentifier: chevre.factory.categoryCode.CategorySetIdentifier
    });
}));
function createMovieFromBody(req) {
    const body = req.body;
    const appliesToCategoryCode = (typeof body.appliesToCategoryCode === 'string' && body.appliesToCategoryCode.length > 0)
        ? JSON.parse(body.appliesToCategoryCode)
        : undefined;
    return Object.assign({ project: req.project, typeOf: body.typeOf, price: Number(body.price), priceCurrency: chevre.factory.priceCurrency.JPY, appliesToCategoryCode: (appliesToCategoryCode !== undefined)
            ? [{
                    typeOf: 'CategoryCode',
                    codeValue: appliesToCategoryCode.codeValue,
                    inCodeSet: {
                        typeOf: 'CategoryCodeSet',
                        identifier: appliesToCategoryCode.inCodeSet.identifier
                    }
                }] : undefined, valueAddedTaxIncluded: true }, (typeof body.appliesToVideoFormat === 'string' && body.appliesToVideoFormat.length > 0)
        ? { appliesToVideoFormat: body.appliesToVideoFormat }
        : undefined, (typeof body.appliesToMovieTicketType === 'string' && body.appliesToMovieTicketType.length > 0)
        ? { appliesToMovieTicketType: body.appliesToMovieTicketType }
        : undefined, {
        $unset: Object.assign({}, (appliesToCategoryCode === undefined)
            ? { appliesToCategoryCode: 1 }
            : undefined, (typeof body.appliesToVideoFormat !== 'string' || body.appliesToVideoFormat.length === 0)
            ? { appliesToVideoFormat: 1 }
            : undefined, (typeof body.appliesToMovieTicketType !== 'string' || body.appliesToMovieTicketType.length === 0)
            ? { appliesToMovieTicketType: 1 }
            : undefined)
    });
}
function validate(req) {
    let colName = '';
    colName = '価格仕様タイプ';
    req.checkBody('typeOf', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}
exports.default = priceSpecificationsRouter;
