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
 * サービス登録取引ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
// import * as csvtojson from 'csvtojson';
// import * as createDebug from 'debug';
const express = require("express");
const moment = require("moment");
// const debug = createDebug('chevre-console:router');
const registerServiceTransactionsRouter = express.Router();
/**
 * サービス登録取引開始
 */
registerServiceTransactionsRouter.all('/start', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let values = {};
        let message = '';
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const registerService = new chevre.service.transaction.RegisterService({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const serviceOutputIdentifierService = new chevre.service.ServiceOutputIdentifier({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const transactionNumberService = new chevre.service.TransactionNumber({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const sellerService = new chevre.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const product = yield productService.findById({ id: req.query.product });
        const offers = yield productService.searchOffers({ id: String(product.id) });
        const selectedOffer = offers[0];
        if (selectedOffer === undefined) {
            throw new Error('selectedOffer undefined');
        }
        if (req.method === 'POST') {
            values = req.body;
            try {
                const serviceOutputName = (_a = req.body.serviceOutput) === null || _a === void 0 ? void 0 : _a.name;
                const numOutputs = (typeof req.body.numOutputs === 'string' && req.body.numOutputs.length > 0)
                    ? Number(req.body.numOutputs)
                    : 1;
                const seller = yield sellerService.findById({ id: (_c = (_b = req.body.serviceOutput) === null || _b === void 0 ? void 0 : _b.issuedBy) === null || _c === void 0 ? void 0 : _c.id });
                const issuedBy = {
                    project: seller.project,
                    id: seller.id,
                    name: seller.name,
                    typeOf: seller.typeOf
                };
                let acceptedOffer;
                // tslint:disable-next-line:prefer-array-literal
                acceptedOffer = [...Array(Number(numOutputs))].map(() => {
                    var _a;
                    return {
                        typeOf: chevre.factory.offerType.Offer,
                        id: selectedOffer.id,
                        itemOffered: {
                            id: product.id,
                            project: product.project,
                            serviceOutput: {
                                issuedBy: issuedBy,
                                name: (typeof serviceOutputName === 'string' && serviceOutputName.length > 0)
                                    ? serviceOutputName
                                    : undefined,
                                project: product.project,
                                typeOf: (_a = product.serviceOutput) === null || _a === void 0 ? void 0 : _a.typeOf
                            },
                            typeOf: product.typeOf
                        }
                    };
                });
                const expires = moment()
                    .add(1, 'minutes')
                    .toDate();
                let object = acceptedOffer;
                object = yield createServiceOutputIdentifier({ acceptedOffer, product })({
                    serviceOutputIdentifierService: serviceOutputIdentifierService
                });
                const { transactionNumber } = yield transactionNumberService.publish({
                    project: { id: req.project.id }
                });
                const transaction = yield registerService.start({
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    typeOf: chevre.factory.transactionType.RegisterService,
                    transactionNumber: transactionNumber,
                    expires: expires,
                    agent: {
                        typeOf: 'Person',
                        id: req.user.profile.sub,
                        name: `${req.user.profile.given_name} ${req.user.profile.family_name}`
                    },
                    object: object
                });
                // 確認画面へ情報を引き継ぐために
                // const transaction = {
                //     transactionNumber: transactionNumber,
                //     object: object
                // };
                // セッションに取引追加
                req.session[`transaction:${transaction.transactionNumber}`] = transaction;
                res.redirect(`/transactions/${transaction.typeOf}/${transaction.transactionNumber}/confirm`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
        const searchSellersResult = yield sellerService.search({ project: { id: { $eq: req.project.id } } });
        res.render('transactions/registerService/start', {
            values: values,
            message: message,
            moment: moment,
            product: product,
            sellers: searchSellersResult.data
        });
    }
    catch (error) {
        next(error);
    }
}));
function createServiceOutputIdentifier(params) {
    return (repos) => __awaiter(this, void 0, void 0, function* () {
        // 識別子を発行
        return Promise.all(params.acceptedOffer.map((o) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { identifier } = yield repos.serviceOutputIdentifierService.publish({
                project: { id: params.product.project.id }
            });
            return Object.assign(Object.assign({}, o), { itemOffered: Object.assign(Object.assign({}, o.itemOffered), { serviceOutput: Object.assign(Object.assign({}, (_a = o.itemOffered) === null || _a === void 0 ? void 0 : _a.serviceOutput), { 
                        // tslint:disable-next-line:no-suspicious-comment
                        accessCode: createAccessCode(), project: params.product.project, typeOf: String((_b = params.product.serviceOutput) === null || _b === void 0 ? void 0 : _b.typeOf), identifier: identifier }) }) });
        })));
    });
}
function createAccessCode() {
    // tslint:disable-next-line:insecure-random no-magic-numbers
    return String(Math.floor((Math.random() * 9000) + 1000));
}
/**
 * 予約取引確認
 */
registerServiceTransactionsRouter.all('/:transactionNumber/confirm', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        let message = '';
        const transaction = req.session[`transaction:${req.params.transactionNumber}`];
        if (transaction === undefined) {
            throw new chevre.factory.errors.NotFound('Transaction in session');
        }
        const productService = new chevre.service.Product({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const registerService = new chevre.service.transaction.RegisterService({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const productId = (_d = transaction.object[0].itemOffered) === null || _d === void 0 ? void 0 : _d.id;
        if (typeof productId !== 'string') {
            throw new chevre.factory.errors.NotFound('Product not specified');
        }
        if (req.method === 'POST') {
            // 確定
            yield registerService.confirm({ transactionNumber: transaction.transactionNumber });
            message = 'サービス登録取引を確定しました';
            // セッション削除
            // tslint:disable-next-line:no-dynamic-delete
            delete req.session[`transaction:${transaction.transactionNumber}`];
            req.flash('message', message);
            res.redirect(`/transactions/${chevre.factory.transactionType.RegisterService}/start?product=${productId}`);
            return;
        }
        else {
            const product = yield productService.findById({ id: productId });
            res.render('transactions/registerService/confirm', {
                transaction: transaction,
                moment: moment,
                message: message,
                product: product
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引中止
 */
registerServiceTransactionsRouter.all('/:transactionNumber/cancel', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        let message = '';
        const transaction = req.session[`transaction:${req.params.transactionNumber}`];
        if (transaction === undefined) {
            throw new chevre.factory.errors.NotFound('Transaction in session');
        }
        const registerService = new chevre.service.transaction.RegisterService({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const productId = (_e = transaction.object[0].itemOffered) === null || _e === void 0 ? void 0 : _e.id;
        if (typeof productId !== 'string') {
            throw new chevre.factory.errors.NotFound('Product not specified');
        }
        if (req.method === 'POST') {
            // 確定
            yield registerService.cancel({ transactionNumber: transaction.transactionNumber });
            message = '予約取引を中止しました';
            // セッション削除
            // tslint:disable-next-line:no-dynamic-delete
            delete req.session[`transaction:${transaction.transactionNumber}`];
            req.flash('message', message);
            res.redirect(`/transactions/${chevre.factory.transactionType.RegisterService}/start?product=${productId}`);
            return;
        }
        throw new Error('not implemented');
    }
    catch (error) {
        next(error);
    }
}));
exports.default = registerServiceTransactionsRouter;
