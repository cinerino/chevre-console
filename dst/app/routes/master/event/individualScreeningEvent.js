"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * パフォーマンス管理ルーター
 */
const express_1 = require("express");
const IndividualScreeningEventController = require("../../../controllers/master/event/individualScreeningEvent");
const performanceMasterRouter = express_1.Router();
performanceMasterRouter.get('', IndividualScreeningEventController.index);
performanceMasterRouter.post('/search', IndividualScreeningEventController.search);
performanceMasterRouter.post('/searchScreeningEvent', IndividualScreeningEventController.searchScreeningEvent);
performanceMasterRouter.post('/regist', IndividualScreeningEventController.regist);
performanceMasterRouter.post('/:eventId/update', IndividualScreeningEventController.update);
exports.default = performanceMasterRouter;
