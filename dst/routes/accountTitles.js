"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 勘定科目コントローラー
 */
const express_1 = require("express");
const AccountTitleController = require("../controllers/accountTitle");
const accountTitlesRouter = express_1.Router();
accountTitlesRouter.get('', AccountTitleController.index);
accountTitlesRouter.get('/getlist', AccountTitleController.getList);
accountTitlesRouter.get('/accountTitleCategory/new', AccountTitleController.createAccountTitleCategory);
accountTitlesRouter.post('/accountTitleCategory/new', AccountTitleController.createAccountTitleCategory);
accountTitlesRouter.get('/accountTitleCategory/:codeValue', AccountTitleController.updateAccountTitleCategory);
accountTitlesRouter.post('/accountTitleCategory/:codeValue', AccountTitleController.updateAccountTitleCategory);
accountTitlesRouter.get('/accountTitleSet/new', AccountTitleController.addAccountTitleSet);
accountTitlesRouter.post('/accountTitleSet/new', AccountTitleController.addAccountTitleSet);
accountTitlesRouter.get('/accountTitleSet/:codeValue', AccountTitleController.updateAccountTitleSet);
accountTitlesRouter.post('/accountTitleSet/:codeValue', AccountTitleController.updateAccountTitleSet);
// accountTitlesRouter.get('/:identifier/update', AccountTitleController.update);
// accountTitlesRouter.post('/:identifier/update', AccountTitleController.update);
accountTitlesRouter.get('/new', AccountTitleController.createAccountTitle);
accountTitlesRouter.post('/new', AccountTitleController.createAccountTitle);
accountTitlesRouter.get('/:codeValue', AccountTitleController.updateAccountTitle);
accountTitlesRouter.post('/:codeValue', AccountTitleController.updateAccountTitle);
exports.default = accountTitlesRouter;
