/**
 * 勘定科目管理ルーター
 */
import { Router } from 'express';

import * as AccountTitleController from '../controllers/accountTitle/accountTitle';

import accountTitleCategoryRouter from './accountTitles/accountTitleCategory';
import accountTitleSetRouter from './accountTitles/accountTitleSet';

const accountTitlesRouter = Router();

accountTitlesRouter.use('/accountTitleCategory', accountTitleCategoryRouter);
accountTitlesRouter.use('/accountTitleSet', accountTitleSetRouter);

accountTitlesRouter.get('', AccountTitleController.index);
accountTitlesRouter.get('/getlist', AccountTitleController.getList);
accountTitlesRouter.get('/new', AccountTitleController.create);
accountTitlesRouter.post('/new', AccountTitleController.create);
accountTitlesRouter.get('/:codeValue', AccountTitleController.update);
accountTitlesRouter.post('/:codeValue', AccountTitleController.update);

export default accountTitlesRouter;
