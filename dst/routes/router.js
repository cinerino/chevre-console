"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * デフォルトルーター
 */
const express = require("express");
const authentication_1 = require("../middlewares/authentication");
const accountTitles_1 = require("./accountTitles");
const addOns_1 = require("./addOns");
const auth_1 = require("./auth");
const categoryCode_1 = require("./categoryCode");
const movie_1 = require("./creativeWork/movie");
const dashboard_1 = require("./dashboard");
const screeningEvent_1 = require("./event/screeningEvent");
const screeningEventSeries_1 = require("./event/screeningEventSeries");
const home_1 = require("./home");
const movieTheater_1 = require("./places/movieTheater");
const screeningRoom_1 = require("./places/screeningRoom");
const seat_1 = require("./places/seat");
const priceSpecifications_1 = require("./priceSpecifications");
const products_1 = require("./products");
const reservations_1 = require("./reservations");
const serviceTypes_1 = require("./serviceTypes");
const ticketType_1 = require("./ticketType");
const ticketTypeGroup_1 = require("./ticketTypeGroup");
const router = express.Router();
router.use(auth_1.default);
router.use(authentication_1.default);
router.use('/', dashboard_1.default);
// プロジェクト決定
router.use((req, res, next) => {
    // セッションにプロジェクトIDがあればリクエストプロジェクトに設定
    if (typeof req.session.projectId === 'string') {
        req.project = {
            typeOf: 'Project',
            id: req.session.projectId
        };
    }
    else {
        res.redirect('/');
        return;
    }
    next();
});
router.use('/home', home_1.default);
router.use('/accountTitles', accountTitles_1.default);
router.use('/addOns', addOns_1.default);
router.use('/categoryCodes', categoryCode_1.default);
router.use('/creativeWorks/movie', movie_1.default);
router.use('/events/screeningEvent', screeningEvent_1.default);
router.use('/events/screeningEventSeries', screeningEventSeries_1.default);
router.use('/places/movieTheater', movieTheater_1.default);
router.use('/places/screeningRoom', screeningRoom_1.default);
router.use('/places/seat', seat_1.default);
router.use('/priceSpecifications', priceSpecifications_1.default);
router.use('/products', products_1.default);
router.use('/reservations', reservations_1.default);
router.use('/serviceTypes', serviceTypes_1.default);
router.use('/ticketTypes', ticketType_1.default);
router.use('/ticketTypeGroups', ticketTypeGroup_1.default);
exports.default = router;
