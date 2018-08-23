"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * パフォーマンス管理ルーター
 */
const express_1 = require("express");
const ScreeningEventController = require("../../../controllers/master/event/screeningEvent");
const performanceMasterRouter = express_1.Router();
performanceMasterRouter.get('', ScreeningEventController.index);
performanceMasterRouter.post('/search', ScreeningEventController.search);
performanceMasterRouter.post('/searchScreeningEvent', ScreeningEventController.searchScreeningEvent);
performanceMasterRouter.post('/regist', ScreeningEventController.regist);
performanceMasterRouter.post('/:eventId/update', ScreeningEventController.update);
exports.default = performanceMasterRouter;
