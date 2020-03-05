"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 科目分類管理ルーター
 */
const express_1 = require("express");
const AccountTitleCategoryController = require("../../controllers/accountTitle/accountTitleCategory");
const accountTitleCategoryRouter = express_1.Router();
accountTitleCategoryRouter.get('', AccountTitleCategoryController.search);
accountTitleCategoryRouter.get('/new', AccountTitleCategoryController.create);
accountTitleCategoryRouter.post('/new', AccountTitleCategoryController.create);
accountTitleCategoryRouter.get('/:codeValue', AccountTitleCategoryController.update);
accountTitleCategoryRouter.post('/:codeValue', AccountTitleCategoryController.update);
exports.default = accountTitleCategoryRouter;
