/**
 * 勘定科目コントローラー
 */
import { Router } from 'express';

import * as AccountTitleController from '../controllers/accountTitle';

const accountTitlesRouter = Router();

accountTitlesRouter.get('/accountTitleCategory/new', AccountTitleController.createAccountTitleCategory);
accountTitlesRouter.post('/accountTitleCategory/new', AccountTitleController.createAccountTitleCategory);
accountTitlesRouter.get('', AccountTitleController.index);
accountTitlesRouter.get('/getlist', AccountTitleController.getList);

accountTitlesRouter.get('/accountTitleSet/new', AccountTitleController.addAccountTitleSet);
accountTitlesRouter.post('/accountTitleSet/new', AccountTitleController.addAccountTitleSet);

// accountTitlesRouter.get('/:identifier/update', AccountTitleController.update);
// accountTitlesRouter.post('/:identifier/update', AccountTitleController.update);

export default accountTitlesRouter;
