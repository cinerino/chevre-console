"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * パフォーマンス管理ルーター
 *
 * @desc performanceRouter
 * @ignore
 */
const express_1 = require("express");
const performanceController = require("../../controllers/master/performance");
const performanceMasterRouter = express_1.Router();
performanceMasterRouter.get('', performanceController.index);
performanceMasterRouter.post('/search', performanceController.search);
performanceMasterRouter.post('/film/search', performanceController.filmSearch);
performanceMasterRouter.post('/regist', performanceController.regist);
performanceMasterRouter.post('/update', performanceController.update);
exports.default = performanceMasterRouter;
