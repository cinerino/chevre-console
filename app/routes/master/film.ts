/**
 * 作品マスタ管理ルーター
 *
 * @desc FilmRouter
 * @ignore
 */

import { Router } from 'express';
import * as filmController from '../../controllers/master/film';

const filmMasterRouter = Router();

filmMasterRouter.all('/add', filmController.add);
filmMasterRouter.all('', filmController.index);
filmMasterRouter.all('/getlist', filmController.getList);
filmMasterRouter.all('/:filmId/update', filmController.update);

export default filmMasterRouter;
