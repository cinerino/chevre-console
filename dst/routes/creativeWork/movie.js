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
 * 作品コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../../message");
const debug = createDebug('chevre-backend:routes');
const THUMBNAIL_URL_MAX_LENGTH = 256;
const ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH = (process.env.ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH !== undefined)
    ? Number(process.env.ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH)
    // tslint:disable-next-line:no-magic-numbers
    : 256;
const NUM_ADDITIONAL_PROPERTY = 5;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES = 10;
const movieRouter = express_1.Router();
movieRouter.all('/add', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = '';
    let errors = {};
    const creativeWorkService = new chevre.service.CreativeWork({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
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
                req.body.id = '';
                let movie = yield createFromBody(req, true);
                const { data } = yield creativeWorkService.searchMovies({
                    limit: 1,
                    project: { ids: [req.project.id] },
                    identifier: { $eq: movie.identifier }
                });
                if (data.length > 0) {
                    throw new Error('既に存在するコードです');
                }
                debug('saving an movie...', movie);
                movie = yield creativeWorkService.createMovie(movie);
                req.flash('message', '登録しました');
                res.redirect(`/creativeWorks/movie/${movie.id}/update`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign({ additionalProperty: [] }, req.body);
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    const searchContentRatingTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType } }
    });
    const searchDistributorTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
    });
    res.render('creativeWorks/movie/add', {
        message: message,
        errors: errors,
        forms: forms,
        contentRatingTypes: searchContentRatingTypesResult.data,
        distributorTypes: searchDistributorTypesResult.data
    });
}));
movieRouter.get('', (__, res) => {
    res.render('creativeWorks/movie/index', {});
});
movieRouter.get('/getlist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchDistributorTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
        });
        const distributorTypes = searchDistributorTypesResult.data;
        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = yield creativeWorkService.searchMovies({
            limit: limit,
            page: page,
            sort: { identifier: chevre.factory.sortType.Ascending },
            project: { ids: [req.project.id] },
            identifier: req.query.identifier,
            name: req.query.name,
            datePublishedFrom: (!_.isEmpty(req.query.datePublishedFrom))
                ? moment(`${req.query.datePublishedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                    .toDate() : undefined,
            datePublishedThrough: (!_.isEmpty(req.query.datePublishedThrough))
                ? moment(`${req.query.datePublishedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                    .toDate()
                : undefined,
            offers: {
                availableFrom: (!_.isEmpty(req.query.availableFrom))
                    ? moment(`${req.query.availableFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate()
                    : undefined,
                availableThrough: (!_.isEmpty(req.query.availableThrough)) ?
                    moment(`${req.query.availableThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                        .toDate() : undefined
            }
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((d) => {
                const distributorType = distributorTypes.find((category) => { var _a; return category.codeValue === ((_a = d.distributor) === null || _a === void 0 ? void 0 : _a.codeValue); });
                const thumbnailUrl = (typeof d.thumbnailUrl === 'string') ? d.thumbnailUrl : '$thumbnailUrl$';
                return Object.assign(Object.assign(Object.assign({}, d), (distributorType !== undefined) ? { distributorName: distributorType.name.ja } : undefined), { thumbnailUrl });
            })
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
// tslint:disable-next-line:use-default-type-parameter
movieRouter.all('/:id/update', ...validate(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const creativeWorkService = new chevre.service.CreativeWork({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const categoryCodeService = new chevre.service.CategoryCode({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors = {};
    let movie = yield creativeWorkService.findMovieById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        const validatorResult = express_validator_1.validationResult(req);
        errors = validatorResult.mapped();
        console.error(errors);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                req.body.id = req.params.id;
                movie = yield createFromBody(req, false);
                debug('saving an movie...', movie);
                yield creativeWorkService.updateMovie(movie);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
    }
    const forms = Object.assign(Object.assign(Object.assign(Object.assign({ additionalProperty: [] }, movie), { distribution: (movie.distributor !== undefined) ? movie.distributor.id : '' }), req.body), { duration: (typeof req.body.duration !== 'string')
            ? (typeof movie.duration === 'string') ? moment.duration(movie.duration)
                .asMinutes() : ''
            : req.body.duration, datePublished: (typeof req.body.datePublished !== 'string')
            ? (movie.datePublished !== undefined) ? moment(movie.datePublished)
                .tz('Asia/Tokyo')
                .format('YYYY/MM/DD') : ''
            : req.body.datePublished, offers: (typeof ((_a = req.body.offers) === null || _a === void 0 ? void 0 : _a.availabilityEnds) !== 'string')
            ? (movie.offers !== undefined && movie.offers.availabilityEnds !== undefined)
                ? {
                    availabilityEnds: moment(movie.offers.availabilityEnds)
                        .add(-1, 'day')
                        .tz('Asia/Tokyo')
                        .format('YYYY/MM/DD')
                }
                : undefined
            : req.body.offers });
    if (forms.additionalProperty.length < NUM_ADDITIONAL_PROPERTY) {
        // tslint:disable-next-line:prefer-array-literal
        forms.additionalProperty.push(...[...Array(NUM_ADDITIONAL_PROPERTY - forms.additionalProperty.length)].map(() => {
            return {};
        }));
    }
    const searchContentRatingTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType } }
    });
    const searchDistributorTypesResult = yield categoryCodeService.search({
        limit: 100,
        project: { id: { $eq: req.project.id } },
        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
    });
    res.render('creativeWorks/movie/edit', {
        message: message,
        errors: errors,
        forms: forms,
        contentRatingTypes: searchContentRatingTypesResult.data,
        distributorTypes: searchDistributorTypesResult.data
    });
}));
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req, isNew) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let contentRating;
        if (typeof req.body.contentRating === 'string' && req.body.contentRating.length > 0) {
            contentRating = req.body.contentRating;
        }
        let duration;
        if (typeof req.body.duration === 'string' && req.body.duration.length > 0) {
            duration = moment.duration(Number(req.body.duration), 'm')
                .toISOString();
        }
        let headline;
        if (typeof req.body.headline === 'string' && req.body.headline.length > 0) {
            headline = req.body.headline;
        }
        let datePublished;
        if (typeof req.body.datePublished === 'string' && req.body.datePublished.length > 0) {
            datePublished = moment(`${req.body.datePublished}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate();
        }
        let availabilityEnds;
        if (typeof ((_a = req.body.offers) === null || _a === void 0 ? void 0 : _a.availabilityEnds) === 'string' && ((_b = req.body.offers) === null || _b === void 0 ? void 0 : _b.availabilityEnds.length) > 0) {
            availabilityEnds = moment(`${(_c = req.body.offers) === null || _c === void 0 ? void 0 : _c.availabilityEnds}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .add(1, 'day')
                .toDate();
        }
        const offers = Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: chevre.factory.offerType.Offer, priceCurrency: chevre.factory.priceCurrency.JPY }, (availabilityEnds !== undefined) ? { availabilityEnds } : undefined);
        let distributor;
        const distributorCodeParam = (_d = req.body.distributor) === null || _d === void 0 ? void 0 : _d.codeValue;
        if (typeof distributorCodeParam === 'string' && distributorCodeParam.length > 0) {
            const searchDistributorTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                codeValue: { $eq: distributorCodeParam }
            });
            const distributorType = searchDistributorTypesResult.data.shift();
            if (distributorType === undefined) {
                throw new Error('配給区分が見つかりません');
            }
            distributor = Object.assign({ id: distributorType.id, codeValue: distributorType.codeValue }, {
                distributorType: distributorType.codeValue
            });
        }
        const thumbnailUrl = (typeof req.body.thumbnailUrl === 'string' && req.body.thumbnailUrl.length > 0) ? req.body.thumbnailUrl : undefined;
        const movie = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: chevre.factory.creativeWorkType.Movie, id: req.body.id, identifier: req.body.identifier, name: req.body.name, offers: offers, additionalProperty: (Array.isArray(req.body.additionalProperty))
                ? req.body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined }, (contentRating !== undefined) ? { contentRating } : undefined), (duration !== undefined) ? { duration } : undefined), (headline !== undefined) ? { headline } : undefined), (datePublished !== undefined) ? { datePublished } : undefined), (distributor !== undefined) ? { distributor } : undefined), (typeof thumbnailUrl === 'string') ? { thumbnailUrl } : undefined), (!isNew)
            ? {
                $unset: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (contentRating === undefined) ? { contentRating: 1 } : undefined), (duration === undefined) ? { duration: 1 } : undefined), (headline === undefined) ? { headline: 1 } : undefined), (datePublished === undefined) ? { datePublished: 1 } : undefined), (distributor === undefined) ? { distributor: 1 } : undefined), (typeof thumbnailUrl !== 'string') ? { thumbnailUrl: 1 } : undefined)
            }
            : undefined);
        if (movie.offers !== undefined
            && movie.offers.availabilityEnds !== undefined
            && movie.datePublished !== undefined
            && movie.offers.availabilityEnds <= movie.datePublished) {
            throw new Error('興行終了予定日が公開日よりも前です');
        }
        return movie;
    });
}
/**
 * コンテンツバリデーション
 */
function validate() {
    return [
        express_validator_1.body('identifier')
            .notEmpty()
            .withMessage(Message.Common.required.replace('$fieldName$', 'コード'))
            .matches(/^[0-9a-zA-Z]+$/)
            .isLength({ max: NAME_MAX_LENGTH_CODE })
            .withMessage(Message.Common.getMaxLength('コード', NAME_MAX_LENGTH_CODE)),
        express_validator_1.body('name', Message.Common.required.replace('$fieldName$', '名称'))
            .notEmpty(),
        express_validator_1.body('name', Message.Common.getMaxLength('名称', NAME_MAX_LENGTH_CODE))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),
        express_validator_1.body('duration', Message.Common.getMaxLengthHalfByte('上映時間', NAME_MAX_LENGTH_NAME_MINUTES))
            .optional()
            .isNumeric()
            .isLength({ max: NAME_MAX_LENGTH_NAME_MINUTES }),
        express_validator_1.body('headline', Message.Common.getMaxLength('サブタイトル', NAME_MAX_LENGTH_CODE))
            .isLength({ max: NAME_MAX_LENGTH_NAME_JA }),
        express_validator_1.body('thumbnailUrl')
            .optional()
            .isURL()
            .withMessage('URLを入力してください')
            .isLength({ max: THUMBNAIL_URL_MAX_LENGTH })
            .withMessage(Message.Common.getMaxLength('サムネイルURL', THUMBNAIL_URL_MAX_LENGTH)),
        express_validator_1.body('additionalProperty.*.name')
            .optional()
            .if((value) => String(value).length > 0)
            .isString()
            .isLength({ max: ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH }),
        express_validator_1.body('additionalProperty.*.value')
            .if((value) => String(value).length > 0)
            .isString()
            .isLength({ max: ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH })
        // colName = '公開日';
        // body('datePublished')
        //     .notEmpty()
        //     .withMessage(Message.Common.required.replace('$fieldName$', colName));
        // colName = '興行終了予定日';
        // body('offers.availabilityEnds')
        //     .notEmpty()
        //     .withMessage(Message.Common.required.replace('$fieldName$', colName));
    ];
}
exports.default = movieRouter;
