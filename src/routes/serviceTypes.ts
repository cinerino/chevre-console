/**
 * 興行区分ルーター
 */
import { Router } from 'express';

import * as ServiceTypeController from '../controllers/serviceType';

const serviceTypesRouter = Router();

serviceTypesRouter.all('/add', ServiceTypeController.add);
serviceTypesRouter.all('', ServiceTypeController.index);
serviceTypesRouter.all('/getlist', ServiceTypeController.getList);
serviceTypesRouter.all('/:id/update', ServiceTypeController.update);

export default serviceTypesRouter;
