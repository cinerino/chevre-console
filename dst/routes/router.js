"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * デフォルトルーター
 */
const express = require("express");
// tslint:disable-next-line:no-require-imports no-var-requires
const subscriptions = require('../../subscriptions.json');
const authentication_1 = require("../middlewares/authentication");
const accountTitles_1 = require("./accountTitles");
const applications_1 = require("./applications");
const auth_1 = require("./auth");
const categoryCode_1 = require("./categoryCode");
const movie_1 = require("./creativeWork/movie");
const dashboard_1 = require("./dashboard");
const screeningEvent_1 = require("./event/screeningEvent");
const screeningEventSeries_1 = require("./event/screeningEventSeries");
const home_1 = require("./home");
const offerCatalogs_1 = require("./offerCatalogs");
const offers_1 = require("./offers");
const movieTheater_1 = require("./places/movieTheater");
const screeningRoom_1 = require("./places/screeningRoom");
const screeningRoomSection_1 = require("./places/screeningRoomSection");
const seat_1 = require("./places/seat");
const priceSpecifications_1 = require("./priceSpecifications");
const products_1 = require("./products");
const projects_1 = require("./projects");
const reservations_1 = require("./reservations");
const services_1 = require("./services");
const ticketType_1 = require("./ticketType");
const transactions_1 = require("./transactions");
const router = express.Router();
router.use(auth_1.default);
router.use(authentication_1.default);
router.use('/', dashboard_1.default);
// プロジェクト決定
router.use((req, res, next) => {
    var _a;
    // セッションにプロジェクトIDがあればリクエストプロジェクトに設定
    if (typeof ((_a = req.session.project) === null || _a === void 0 ? void 0 : _a.id) === 'string') {
        req.project = req.session.project;
        const subscriptionIdentifier = req.session.subscriptionIdentifier;
        const subscription = subscriptions.find((s) => s.identifier === subscriptionIdentifier);
        req.subscription = subscription;
    }
    else {
        res.redirect('/');
        return;
    }
    next();
});
router.use('/home', home_1.default);
router.use('/accountTitles', accountTitles_1.default);
router.use('/applications', applications_1.default);
router.use('/categoryCodes', categoryCode_1.default);
router.use('/creativeWorks/movie', movie_1.default);
router.use('/events/screeningEvent', screeningEvent_1.default);
router.use('/events/screeningEventSeries', screeningEventSeries_1.default);
router.use('/offerCatalogs', offerCatalogs_1.default);
router.use('/offers', offers_1.default);
router.use('/places/movieTheater', movieTheater_1.default);
router.use('/places/screeningRoom', screeningRoom_1.default);
router.use('/places/screeningRoomSection', screeningRoomSection_1.default);
router.use('/places/seat', seat_1.default);
router.use('/priceSpecifications', priceSpecifications_1.default);
router.use('/products', products_1.default);
router.use('/projects', projects_1.default);
router.use('/reservations', reservations_1.default);
router.use('/services', services_1.default);
router.use('/ticketTypes', ticketType_1.default);
router.use('/transactions', transactions_1.default);
exports.default = router;
