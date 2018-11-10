/**
 * 勘定科目コントローラー
 */
import { Router } from 'express';

import * as AccountTitleController from '../controllers/accountTitle';

const accountTitlesRouter = Router();

accountTitlesRouter.get('/add', AccountTitleController.add);
accountTitlesRouter.post('/add', AccountTitleController.add);
accountTitlesRouter.get('', AccountTitleController.index);
accountTitlesRouter.get('/getlist', AccountTitleController.getList);
accountTitlesRouter.get('/:identifier/update', AccountTitleController.update);
accountTitlesRouter.post('/:identifier/update', AccountTitleController.update);

export default accountTitlesRouter;
