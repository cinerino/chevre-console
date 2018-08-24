/**
 * 上映イベント管理ルーター
 */
import { Router } from 'express';

import * as ScreeningEventController from '../../controllers/event/screeningEvent';

const screeningEventRouter = Router();
screeningEventRouter.get('', ScreeningEventController.index);
screeningEventRouter.post('/search', ScreeningEventController.search);
screeningEventRouter.post('/searchScreeningEvent', ScreeningEventController.searchScreeningEvent);
screeningEventRouter.post('/regist', ScreeningEventController.regist);
screeningEventRouter.post('/:eventId/update', ScreeningEventController.update);
export default screeningEventRouter;
