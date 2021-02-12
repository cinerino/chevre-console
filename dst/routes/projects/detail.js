"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * プロジェクト詳細ルーター
 */
const express = require("express");
const accountTitles_1 = require("../accountTitles");
const actions_1 = require("../actions");
const applications_1 = require("../applications");
const categoryCode_1 = require("../categoryCode");
const creativeWorks_1 = require("../creativeWorks");
const screeningEvent_1 = require("../event/screeningEvent");
const screeningEventSeries_1 = require("../event/screeningEventSeries");
const home_1 = require("../home");
const offerCatalogs_1 = require("../offerCatalogs");
const offers_1 = require("../offers");
const paymentServices_1 = require("../paymentServices");
const movieTheater_1 = require("../places/movieTheater");
const screeningRoom_1 = require("../places/screeningRoom");
const screeningRoomSection_1 = require("../places/screeningRoomSection");
const seat_1 = require("../places/seat");
const priceSpecifications_1 = require("../priceSpecifications");
const products_1 = require("../products");
const reservations_1 = require("../reservations");
const sellers_1 = require("../sellers");
const settings_1 = require("../settings");
const ticketType_1 = require("../ticketType");
const transactions_1 = require("../transactions");
const projectDetailRouter = express.Router();
projectDetailRouter.use('/home', home_1.default);
projectDetailRouter.use('/accountTitles', accountTitles_1.default);
projectDetailRouter.use('/actions', actions_1.default);
projectDetailRouter.use('/applications', applications_1.default);
projectDetailRouter.use('/categoryCodes', categoryCode_1.default);
projectDetailRouter.use('/creativeWorks', creativeWorks_1.default);
projectDetailRouter.use('/events/screeningEvent', screeningEvent_1.default);
projectDetailRouter.use('/events/screeningEventSeries', screeningEventSeries_1.default);
projectDetailRouter.use('/offerCatalogs', offerCatalogs_1.default);
projectDetailRouter.use('/offers', offers_1.default);
projectDetailRouter.use('/paymentServices', paymentServices_1.default);
projectDetailRouter.use('/places/movieTheater', movieTheater_1.default);
projectDetailRouter.use('/places/screeningRoom', screeningRoom_1.default);
projectDetailRouter.use('/places/screeningRoomSection', screeningRoomSection_1.default);
projectDetailRouter.use('/places/seat', seat_1.default);
projectDetailRouter.use('/priceSpecifications', priceSpecifications_1.default);
projectDetailRouter.use('/products', products_1.default);
projectDetailRouter.use('/reservations', reservations_1.default);
projectDetailRouter.use('/sellers', sellers_1.default);
projectDetailRouter.use('/settings', settings_1.default);
projectDetailRouter.use('/ticketTypes', ticketType_1.default);
projectDetailRouter.use('/transactions', transactions_1.default);
exports.default = projectDetailRouter;
