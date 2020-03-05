/**
 * 科目分類管理ルーター
 */
import { Router } from 'express';

import * as AccountTitleCategoryController from '../../controllers/accountTitle/accountTitleCategory';

const accountTitleCategoryRouter = Router();

accountTitleCategoryRouter.get('', AccountTitleCategoryController.search);
accountTitleCategoryRouter.get('/new', AccountTitleCategoryController.create);
accountTitleCategoryRouter.post('/new', AccountTitleCategoryController.create);
accountTitleCategoryRouter.get('/:codeValue', AccountTitleCategoryController.update);
accountTitleCategoryRouter.post('/:codeValue', AccountTitleCategoryController.update);

export default accountTitleCategoryRouter;
