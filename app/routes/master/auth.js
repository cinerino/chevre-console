"use strict";
/**
 * ユーザー認証ルーター
 *
 * @function authRouter
 * @ignore
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const masterAuthController = require("../../controllers/master/auth");
const authMasterRouter = express_1.Router();
// ログイン・ログアウト
authMasterRouter.all('/master/login', masterAuthController.login);
//'master.logout
authMasterRouter.all('/master/logout', masterAuthController.logout);
exports.default = authMasterRouter;
