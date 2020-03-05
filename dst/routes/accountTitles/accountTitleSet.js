"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 科目管理ルーター
 */
const express_1 = require("express");
const AccountTitleSetController = require("../../controllers/accountTitle/accountTitleSet");
const accountTitleSetRouter = express_1.Router();
accountTitleSetRouter.get('', AccountTitleSetController.search);
accountTitleSetRouter.get('/new', AccountTitleSetController.create);
accountTitleSetRouter.post('/new', AccountTitleSetController.create);
accountTitleSetRouter.get('/:codeValue', AccountTitleSetController.update);
accountTitleSetRouter.post('/:codeValue', AccountTitleSetController.update);
exports.default = accountTitleSetRouter;
