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
 * 口座ルーター
 */
const chevreapi = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment-timezone");
const accountsRouter = express_1.Router();
accountsRouter.get('', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountService = new chevreapi.service.Account({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        if (req.query.format === 'datatable') {
            const searchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                accountNumber: {
                    $eq: (typeof req.query.accountNumber === 'string' && req.query.accountNumber.length > 0)
                        ? req.query.accountNumber
                        : undefined
                }
            };
            const searchResult = yield accountService.search(searchConditions);
            searchResult.data = searchResult.data.map((a) => {
                return Object.assign({}, a);
            });
            res.json({
                success: true,
                count: (searchResult.data.length === Number(searchConditions.limit))
                    ? (Number(searchConditions.page) * Number(searchConditions.limit)) + 1
                    : ((Number(searchConditions.page) - 1) * Number(searchConditions.limit)) + Number(searchResult.data.length),
                results: searchResult.data
            });
            // } else if (req.query.format === cinerinoapi.factory.chevre.encodingFormat.Text.csv) {
            //     const stream = <NodeJS.ReadableStream>await streamingOrderService.download({
            //         ...searchConditions,
            //         format: cinerinoapi.factory.chevre.encodingFormat.Text.csv,
            //         limit: undefined,
            //         page: undefined
            //     });
            //     const filename = 'OrderReport';
            //     res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
            //     res.setHeader('Content-Type', `${cinerinoapi.factory.chevre.encodingFormat.Text.csv}; charset=UTF-8`);
            //     stream.pipe(res);
            // } else if (req.query.format === cinerinoapi.factory.chevre.encodingFormat.Application.json) {
            //     const stream = <NodeJS.ReadableStream>await streamingOrderService.download({
            //         ...searchConditions,
            //         format: cinerinoapi.factory.chevre.encodingFormat.Application.json,
            //         limit: undefined,
            //         page: undefined
            //     });
            //     const filename = 'OrderReport';
            //     res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.json`)}`);
            //     res.setHeader('Content-Type', `${cinerinoapi.factory.chevre.encodingFormat.Application.json}; charset=UTF-8`);
            //     stream.pipe(res);
        }
        else {
            res.render('accounts/index', {
                moment: moment,
                query: req.query
            });
        }
    }
    catch (error) {
        if (req.query.format === 'datatable') {
            res.status((typeof error.code === 'number') ? error.code : http_status_1.INTERNAL_SERVER_ERROR)
                .json({ message: error.message });
        }
        else {
            next(error);
        }
    }
}));
accountsRouter.get('/:accountNumber/moneyTransferActions', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountService = new chevreapi.service.Account({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient,
            project: { id: req.project.id }
        });
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            sort: { startDate: chevreapi.factory.sortType.Descending }
        };
        const searchResult = yield accountService.searchMoneyTransferActions(Object.assign(Object.assign({}, searchConditions), { accountNumber: req.params.accountNumber }));
        res.json(searchResult.data);
    }
    catch (error) {
        res.status((typeof error.code === 'number') ? error.code : http_status_1.INTERNAL_SERVER_ERROR)
            .json({ message: error.message });
    }
}));
exports.default = accountsRouter;
