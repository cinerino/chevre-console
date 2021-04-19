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
 * 顧客ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const Message = require("../message");
const NUM_ADDITIONAL_PROPERTY = 10;
const customersRouter = express_1.Router();
customersRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('customers/index', {
        message: ''
    });
}));
// tslint:disable-next-line:use-default-type-parameter
customersRouter.all('/new', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const customerService = new chevre.service.Customer({
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
                let customer = yield createFromBody(req, true);
                customer = yield customerService.create(customer);
                req.flash('message', '登録しました');
                res.redirect(`/projects/${req.project.id}/customers/${customer.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [], name: {} }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    res.render('customers/new', {
        message: message,
        errors: errors,
        forms: forms
    });
}));
customersRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customerService = new chevre.service.Customer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const searchConditions = {
            limit: limit,
            page: page,
            project: { id: { $eq: req.project.id } },
            name: (typeof req.query.name === 'string' && req.query.name.length > 0) ? { $regex: req.query.name } : undefined
        };
        let data;
        const searchResult = yield customerService.search(searchConditions);
        data = searchResult.data;
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((t) => {
                return Object.assign({}, t);
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
customersRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customerService = new chevre.service.Customer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const customer = yield customerService.findById({ id: String(req.params.id) });
        res.json(customer);
    }
    catch (err) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            message: err.message
        });
    }
}));
customersRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customerService = new chevre.service.Customer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const customer = yield customerService.findById({ id: req.params.id });
        yield preDelete(req, customer);
        yield customerService.deleteById({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        res.status(http_status_1.BAD_REQUEST)
            .json({ error: { message: error.message } });
    }
}));
function preDelete(__, ___) {
    return __awaiter(this, void 0, void 0, function* () {
        // 施設が存在するかどうか
        // const placeService = new chevre.service.Place({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const searchMovieTheatersResult = await placeService.searchMovieTheaters({
        //     limit: 1,
        //     project: { ids: [req.project.id] },
        //     parentOrganization: { id: { $eq: seller.id } }
        // });
        // if (searchMovieTheatersResult.data.length > 0) {
        //     throw new Error('関連する施設が存在します');
        // }
    });
}
// tslint:disable-next-line:use-default-type-parameter
customersRouter.all('/:id/update', ...validate(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const customerService = new chevre.service.Customer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        let customer = yield customerService.findById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            // 検証
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = req.params.id;
                    customer = yield createFromBody(req, false);
                    yield customerService.update({ id: String(customer.id), attributes: customer });
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign({}, customer), req.body);
        if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
            // tslint:disable-next-line:prefer-array-literal
            forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
                return {};
            }));
        }
        if (req.method === 'POST') {
            // no op
        }
        else {
            // no op
        }
        res.render('customers/update', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
    catch (error) {
        next(error);
    }
}));
// tslint:disable-next-line:cyclomatic-complexity
function createFromBody(req, isNew) {
    var _a;
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
        const telephone = req.body.telephone;
        const url = req.body.url;
        return Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: 'Organization', id: req.body.id, name: Object.assign(Object.assign(Object.assign({}, nameFromJson), { ja: req.body.name.ja }), (typeof ((_a = req.body.name) === null || _a === void 0 ? void 0 : _a.en) === 'string') ? { en: req.body.name.en } : undefined), additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined }, (typeof telephone === 'string' && telephone.length > 0) ? { telephone } : undefined), (typeof url === 'string' && url.length > 0) ? { url } : undefined), (!isNew)
            ? {
                $unset: Object.assign(Object.assign({}, (typeof telephone !== 'string' || telephone.length === 0) ? { telephone: 1 } : undefined), (typeof url !== 'string' || url.length === 0) ? { url: 1 } : undefined)
            }
            : undefined);
    });
}
function validate() {
    return [
        express_validator_1.body(['name.ja'])
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', '名称'))
            .isLength({ max: 64 })
            // tslint:disable-next-line:no-magic-numbers
            .withMessage(Message.Common.getMaxLength('名称', 64))
    ];
}
exports.default = customersRouter;
