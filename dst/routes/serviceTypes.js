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
 * 興行区分ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const Message = require("../common/Const/Message");
const debug = createDebug('chevre-backend:router');
const NUM_ADDITIONAL_PROPERTY = 10;
const serviceTypesRouter = express_1.Router();
serviceTypesRouter.all('/add', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req, 'add');
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const serviceType = createMovieFromBody(req.body);
                debug('saving an serviceType...', serviceType);
                const serviceTypeService = new chevre.service.ServiceType({
                    endpoint: process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                yield serviceTypeService.create(serviceType);
                req.flash('message', '登録しました');
                res.redirect(`/serviceTypes/${serviceType.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [] }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('serviceTypes/add', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
serviceTypesRouter.get('', (_, res) => {
    res.render('serviceTypes/index', {
        message: ''
    });
});
serviceTypesRouter.get('/getlist', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const serviceTypeService = new chevre.service.ServiceType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = yield serviceTypeService.search({
            limit: req.query.limit,
            page: req.query.page,
            ids: (req.query.id !== undefined && req.query.id !== '') ? [req.query.id] : undefined,
            name: req.query.name
        });
        res.json({
            success: true,
            count: result.totalCount,
            results: result.data
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
serviceTypesRouter.all('/:id/update', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const serviceTypeService = new chevre.service.ServiceType({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let serviceType = yield serviceTypeService.findById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        validate(req, 'update');
        const validatorResult = yield req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                serviceType = createMovieFromBody(req.body);
                debug('saving an serviceType...', serviceType);
                yield serviceTypeService.update(serviceType);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [] }, serviceType, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('serviceTypes/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
exports.default = serviceTypesRouter;
function createMovieFromBody(body) {
    return {
        typeOf: 'ServiceType',
        id: body.id,
        name: body.name,
        additionalProperty: (Array.isArray(body.additionalProperty))
            ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                .map((p) => {
                return {
                    name: String(p.name),
                    value: String(p.value)
                };
            })
            : undefined
    };
}
const NAME_MAX_LENGTH_CODE = 64;
const NAME_MAX_LENGTH_NAME_JA = 64;
function validate(req, checkType) {
    let colName = '';
    if (checkType === 'add') {
        colName = '興行区分コード';
        req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    colName = '名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
}
