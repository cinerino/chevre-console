"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ユーザー認証ルーター
 */
const express_1 = require("express");
// import * as masterAuthController from '../../controllers/master/auth';
const authMasterRouter = express_1.Router();
// ログイン・ログアウト
// authMasterRouter.all('/master/login', masterAuthController.login);
//'master.logout
// authMasterRouter.all('/master/logout', masterAuthController.logout);
exports.default = authMasterRouter;
