/**
 * 上映イベントシリーズマスタ管理ルーター
 */
import { Router } from 'express';
import * as ScreeningEventSeriesController from '../../../controllers/master/event/screeningEventSeries';

const filmMasterRouter = Router();

filmMasterRouter.all('/add', ScreeningEventSeriesController.add);
filmMasterRouter.all('', ScreeningEventSeriesController.index);
filmMasterRouter.all('/getlist', ScreeningEventSeriesController.getList);
filmMasterRouter.all('/:eventId/update', ScreeningEventSeriesController.update);

export default filmMasterRouter;
