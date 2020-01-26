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
 * 作品コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
// import * as createDebug from 'debug';
const express_1 = require("express");
const moment = require("moment-timezone");
const _ = require("underscore");
const MovieController = require("../../controllers/creativeWork/movie");
const movieRouter = express_1.Router();
movieRouter.all('/add', MovieController.add);
movieRouter.all('', (__, res) => {
    res.render('creativeWorks/movie/index', {});
});
movieRouter.all('/getlist', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield creativeWorkService.searchMovies({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            identifier: req.query.identifier,
            name: req.query.name,
            datePublishedFrom: (!_.isEmpty(req.query.datePublishedFrom)) ?
                moment(`${req.query.datePublishedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
            datePublishedThrough: (!_.isEmpty(req.query.datePublishedThrough)) ?
                moment(`${req.query.datePublishedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
            offers: {
                availableFrom: (!_.isEmpty(req.query.availableFrom)) ?
                    moment(`${req.query.availableFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
                availableThrough: (!_.isEmpty(req.query.availableThrough)) ?
                    moment(`${req.query.availableThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined
            }
        });
        const results = data.map((movie) => {
            return Object.assign({}, movie, { dayPublished: (movie.datePublished !== undefined)
                    ? moment(movie.datePublished).tz('Asia/Tokyo').format('YYYY/MM/DD')
                    : '未指定', dayAvailabilityEnds: (movie.offers !== undefined && movie.offers.availabilityEnds !== undefined)
                    ? moment(movie.offers.availabilityEnds).add(-1, 'day').tz('Asia/Tokyo').format('YYYY/MM/DD')
                    : '未指定' });
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: results
        });
    }
    catch (error) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
movieRouter.all('/:id/update', MovieController.update);
exports.default = movieRouter;
