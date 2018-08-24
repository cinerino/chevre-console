"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 上映イベント管理ルーター
 */
const express_1 = require("express");
const ScreeningEventController = require("../../controllers/event/screeningEvent");
const screeningEventRouter = express_1.Router();
screeningEventRouter.get('', ScreeningEventController.index);
screeningEventRouter.post('/search', ScreeningEventController.search);
screeningEventRouter.post('/searchScreeningEvent', ScreeningEventController.searchScreeningEvent);
screeningEventRouter.post('/regist', ScreeningEventController.regist);
screeningEventRouter.post('/:eventId/update', ScreeningEventController.update);
exports.default = screeningEventRouter;
