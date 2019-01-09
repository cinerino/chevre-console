"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 勘定科目コントローラー
 */
const express_1 = require("express");
const AccountTitleController = require("../controllers/accountTitle");
const accountTitlesRouter = express_1.Router();
accountTitlesRouter.get('/accountTitleCategory/new', AccountTitleController.createAccountTitleCategory);
accountTitlesRouter.post('/accountTitleCategory/new', AccountTitleController.createAccountTitleCategory);
accountTitlesRouter.get('', AccountTitleController.index);
accountTitlesRouter.get('/getlist', AccountTitleController.getList);
accountTitlesRouter.get('/accountTitleSet/new', AccountTitleController.addAccountTitleSet);
accountTitlesRouter.post('/accountTitleSet/new', AccountTitleController.addAccountTitleSet);
// accountTitlesRouter.get('/:identifier/update', AccountTitleController.update);
// accountTitlesRouter.post('/:identifier/update', AccountTitleController.update);
exports.default = accountTitlesRouter;
