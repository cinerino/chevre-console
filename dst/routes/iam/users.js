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
 * IAMユーザールーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
// import * as Message from '../../message';
const iamUsersRouter = express_1.Router();
iamUsersRouter.get('', (__, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('iam/users/index', {
        message: '',
        TaskName: chevre.factory.taskName,
        TaskStatus: chevre.factory.taskStatus
    });
}));
iamUsersRouter.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const iamService = new chevre.service.IAM({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchConditions = {
            // limit: req.query.limit,
            // page: req.query.page,
            username: (req.query.username !== undefined && req.query.username !== '') ? req.query.username : undefined,
            email: (typeof req.query.email === 'string' && req.query.email.length > 0) ? req.query.email : undefined,
            telephone: (req.query.telephone !== undefined && req.query.telephone !== '') ? req.query.telephone : undefined,
            familyName: (req.query.familyName !== undefined && req.query.familyName !== '') ? req.query.familyName : undefined,
            givenName: (req.query.givenName !== undefined && req.query.givenName !== '') ? req.query.givenName : undefined
        };
        const { data } = yield iamService.searchUsers(searchConditions);
        res.json({
            success: true,
            count: (data.length === Number(searchConditions.limit))
                ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(data.length),
            results: data.map((m) => {
                return Object.assign({}, m);
            })
        });
    }
    catch (err) {
        res.status((typeof err.code === 'number') ? err.code : http_status_1.INTERNAL_SERVER_ERROR)
            .json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
// tslint:disable-next-line:use-default-type-parameter
iamUsersRouter.all('/:id/update', 
// ...validate(),
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const iamService = new chevre.service.IAM({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient,
        project: { id: req.project.id }
    });
    try {
        const user = yield iamService.findUserById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            const validatorResult = express_validator_1.validationResult(req);
            errors = validatorResult.mapped();
            // 検証
            if (validatorResult.isEmpty()) {
                try {
                    // 管理者としてプロフィール更新の場合、メールアドレスを認証済にセット
                    const additionalProperty = (Array.isArray(req.body.additionalProperty))
                        ? req.body.additionalProperty
                        : [];
                    additionalProperty.push({
                        name: 'email_verified',
                        value: 'true'
                    });
                    const profile = Object.assign(Object.assign({}, req.body), { additionalProperty: additionalProperty });
                    yield iamService.updateUserProfile(Object.assign(Object.assign({}, profile), { id: req.params.id }));
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign(Object.assign({}, user), req.body);
        // if (req.method === 'POST') {
        // } else {
        // }
        res.render('iam/users/update', {
            message: message,
            errors: errors,
            forms: forms
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = iamUsersRouter;
