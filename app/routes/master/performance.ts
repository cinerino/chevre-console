/**
 * パフォーマンス管理ルーター
 *
 * @desc performanceRouter
 * @ignore
 */
import { Router } from 'express';
import * as performanceController from '../../controllers/master/performance';

const performanceMasterRouter = Router();

performanceMasterRouter.get('', performanceController.index);
performanceMasterRouter.post('/search', performanceController.search);
performanceMasterRouter.post('/film/search', performanceController.filmSearch);
performanceMasterRouter.post('/regist', performanceController.regist);
performanceMasterRouter.post('/update', performanceController.update);
export default performanceMasterRouter;
