"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 上映イベントシリーズマスタ管理ルーター
 */
const express_1 = require("express");
const ScreeningEventSeriesController = require("../../../controllers/master/event/screeningEventSeries");
const filmMasterRouter = express_1.Router();
filmMasterRouter.all('/add', ScreeningEventSeriesController.add);
filmMasterRouter.all('', ScreeningEventSeriesController.index);
filmMasterRouter.all('/getlist', ScreeningEventSeriesController.getList);
filmMasterRouter.all('/:eventId/update', ScreeningEventSeriesController.update);
exports.default = filmMasterRouter;
