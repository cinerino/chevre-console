"use strict";
/**
 * レポート出力管理ルーター
 *
 * @desc reportRouter
 * @ignore
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController = require("../../controllers/master/report");
const reportMasterRouter = express_1.Router();
// 売り上げレポート出力
reportMasterRouter.get('', reportController.index);
reportMasterRouter.get('/getSales', reportController.getSales);
// アカウント別レポート出力
exports.default = reportMasterRouter;
