"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 勘定科目管理ルーター
 */
const express_1 = require("express");
const AccountTitleController = require("../controllers/accountTitle/accountTitle");
const accountTitleCategory_1 = require("./accountTitles/accountTitleCategory");
const accountTitleSet_1 = require("./accountTitles/accountTitleSet");
const accountTitlesRouter = express_1.Router();
accountTitlesRouter.use('/accountTitleCategory', accountTitleCategory_1.default);
accountTitlesRouter.use('/accountTitleSet', accountTitleSet_1.default);
accountTitlesRouter.get('', AccountTitleController.index);
accountTitlesRouter.get('/getlist', AccountTitleController.getList);
accountTitlesRouter.get('/new', AccountTitleController.create);
accountTitlesRouter.post('/new', AccountTitleController.create);
accountTitlesRouter.get('/:codeValue', AccountTitleController.update);
accountTitlesRouter.post('/:codeValue', AccountTitleController.update);
exports.default = accountTitlesRouter;
