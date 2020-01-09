"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * デフォルトルーター
 */
const express = require("express");
const authentication_1 = require("../middlewares/authentication");
const accountTitles_1 = require("./accountTitles");
const auth_1 = require("./auth");
const movie_1 = require("./creativeWork/movie");
const dashboard_1 = require("./dashboard");
const screeningEvent_1 = require("./event/screeningEvent");
const screeningEventSeries_1 = require("./event/screeningEventSeries");
const home_1 = require("./home");
const movieTheater_1 = require("./places/movieTheater");
const priceSpecifications_1 = require("./priceSpecifications");
const productOffer_1 = require("./productOffer");
const reservations_1 = require("./reservations");
const serviceTypes_1 = require("./serviceTypes");
const ticketType_1 = require("./ticketType");
const ticketTypeGroup_1 = require("./ticketTypeGroup");
const router = express.Router();
router.use(auth_1.default);
router.use(authentication_1.default);
router.use('/', dashboard_1.default);
router.use('/home', home_1.default);
router.use('/accountTitles', accountTitles_1.default);
router.use('/creativeWorks/movie', movie_1.default);
router.use('/events/screeningEvent', screeningEvent_1.default);
router.use('/events/screeningEventSeries', screeningEventSeries_1.default);
router.use('/places/movieTheater', movieTheater_1.default);
router.use('/priceSpecifications', priceSpecifications_1.default);
router.use('/productOffers', productOffer_1.default);
router.use('/reservations', reservations_1.default);
router.use('/serviceTypes', serviceTypes_1.default);
router.use('/ticketTypes', ticketType_1.default);
router.use('/ticketTypeGroups', ticketTypeGroup_1.default);
exports.default = router;
