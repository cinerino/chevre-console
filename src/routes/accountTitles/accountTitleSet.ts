/**
 * 科目管理ルーター
 */
import { Router } from 'express';

import * as AccountTitleSetController from '../../controllers/accountTitle/accountTitleSet';

const accountTitleSetRouter = Router();

accountTitleSetRouter.get('', AccountTitleSetController.search);
accountTitleSetRouter.get('/new', AccountTitleSetController.create);
accountTitleSetRouter.post('/new', AccountTitleSetController.create);
accountTitleSetRouter.get('/:codeValue', AccountTitleSetController.update);
accountTitleSetRouter.post('/:codeValue', AccountTitleSetController.update);

export default accountTitleSetRouter;
