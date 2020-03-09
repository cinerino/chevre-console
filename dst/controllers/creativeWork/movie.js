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
const moment = require("moment-timezone");
const Message = require("../../message");
const debug = createDebug('chevre-backend:controllers');
const NUM_ADDITIONAL_PROPERTY = 5;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES = 10;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
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
                        throw new Error('既に存在する作品コードです');
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
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
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
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
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
    });
}
exports.update = update;
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromBody(req, isNew) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let contentRating;
        if (typeof body.contentRating === 'string' && body.contentRating.length > 0) {
            contentRating = body.contentRating;
        }
        let duration;
        if (typeof body.duration === 'string' && body.duration.length > 0) {
            duration = moment.duration(Number(body.duration), 'm')
                .toISOString();
        }
        let headline;
        if (typeof body.headline === 'string' && body.headline.length > 0) {
            headline = body.headline;
        }
        let datePublished;
        if (typeof body.datePublished === 'string' && body.datePublished.length > 0) {
            datePublished = moment(`${body.datePublished}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .toDate();
        }
        let availabilityEnds;
        if (typeof ((_a = body.offers) === null || _a === void 0 ? void 0 : _a.availabilityEnds) === 'string' && ((_b = body.offers) === null || _b === void 0 ? void 0 : _b.availabilityEnds.length) > 0) {
            availabilityEnds = moment(`${(_c = body.offers) === null || _c === void 0 ? void 0 : _c.availabilityEnds}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ')
                .add(1, 'day')
                .toDate();
        }
        const offers = Object.assign({ project: { typeOf: req.project.typeOf, id: req.project.id }, typeOf: chevre.factory.offerType.Offer, priceCurrency: chevre.factory.priceCurrency.JPY }, (availabilityEnds !== undefined) ? { availabilityEnds } : undefined);
        let distributor;
        const distributorCodeParam = (_d = body.distributor) === null || _d === void 0 ? void 0 : _d.codeValue;
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
        const movie = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ project: req.project, typeOf: chevre.factory.creativeWorkType.Movie, id: body.id, identifier: body.identifier, name: body.name, offers: offers, additionalProperty: (Array.isArray(body.additionalProperty))
                ? body.additionalProperty.filter((p) => typeof p.name === 'string' && p.name !== '')
                    .map((p) => {
                    return {
                        name: String(p.name),
                        value: String(p.value)
                    };
                })
                : undefined }, (contentRating !== undefined) ? { contentRating } : undefined), (duration !== undefined) ? { duration } : undefined), (headline !== undefined) ? { headline } : undefined), (datePublished !== undefined) ? { datePublished } : undefined), (distributor !== undefined) ? { distributor } : undefined), (!isNew)
            ? {
                $unset: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (contentRating === undefined) ? { contentRating: 1 } : undefined), (duration === undefined) ? { duration: 1 } : undefined), (headline === undefined) ? { headline: 1 } : undefined), (datePublished === undefined) ? { datePublished: 1 } : undefined), (distributor === undefined) ? { distributor: 1 } : undefined)
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
 * 作品マスタ新規登録画面検証
 */
function validate(req) {
    let colName = 'コード';
    req.checkBody('identifier')
        .notEmpty()
        .withMessage(Message.Common.required.replace('$fieldName$', colName))
        .matches(/^[0-9a-zA-Z]+$/)
        .len({ max: NAME_MAX_LENGTH_CODE })
        .withMessage(Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE));
    colName = '名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName))
        .notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '上映時間';
    if (req.body.duration !== '') {
        req.checkBody('duration', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_NAME_MINUTES))
            .optional()
            .isNumeric()
            .len({ max: NAME_MAX_LENGTH_NAME_MINUTES });
    }
    colName = 'サブタイトル';
    req.checkBody('headline', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // colName = '公開日';
    // req.checkBody('datePublished')
    //     .notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName));
    // colName = '興行終了予定日';
    // req.checkBody('offers.availabilityEnds')
    //     .notEmpty()
    //     .withMessage(Message.Common.required.replace('$fieldName$', colName));
}
