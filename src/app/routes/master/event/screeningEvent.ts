/**
 * パフォーマンス管理ルーター
 */
import { Router } from 'express';
import * as ScreeningEventController from '../../../controllers/master/event/screeningEvent';

const performanceMasterRouter = Router();
performanceMasterRouter.get('', ScreeningEventController.index);
performanceMasterRouter.post('/search', ScreeningEventController.search);
performanceMasterRouter.post('/searchScreeningEvent', ScreeningEventController.searchScreeningEvent);
performanceMasterRouter.post('/regist', ScreeningEventController.regist);
performanceMasterRouter.post('/:eventId/update', ScreeningEventController.update);
export default performanceMasterRouter;
