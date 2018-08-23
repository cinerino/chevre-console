"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * デフォルトルーター
 */
const express = require("express");
const router = express.Router();
const IndexController = require("../controllers/index");
const userAuthentication_1 = require("../middlewares/userAuthentication");
const auth_1 = require("./master/auth");
const movie_1 = require("./master/creativeWork/movie");
const screeningEvent_1 = require("./master/event/screeningEvent");
const screeningEventSeries_1 = require("./master/event/screeningEventSeries");
const ticketType_1 = require("./master/ticketType");
const ticketTypeGroup_1 = require("./master/ticketTypeGroup");
// ルーティング登録の順序に注意！
router.use(auth_1.default); // ログイン・ログアウト
router.use(userAuthentication_1.default); // ユーザー認証
router.use('/master/creativeWorks/movie', movie_1.default);
router.use('/master/events/screeningEvent', screeningEvent_1.default);
router.use('/master/events/screeningEventSeries', screeningEventSeries_1.default);
router.use('/master/ticketTypes', ticketType_1.default); //券種
router.use('/master/ticketTypeGroups', ticketTypeGroup_1.default); //券種グループ
router.get('/', IndexController.index);
exports.default = router;
