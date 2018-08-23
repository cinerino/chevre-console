/**
 * デフォルトルーター
 */
import * as express from 'express';
const router = express.Router();

import * as IndexController from '../controllers/index';
import userAuthentication from '../middlewares/userAuthentication';

import authMasterRouter from './master/auth';
import movieRouter from './master/creativeWork/movie';
import screeningEventMasterRouter from './master/event/screeningEvent';
import screeningEventSeriesMasterRouter from './master/event/screeningEventSeries';
import ticketTypeMasterRouter from './master/ticketType';
import ticketTypeGroupMasterRouter from './master/ticketTypeGroup';

// ルーティング登録の順序に注意！
router.use(authMasterRouter); // ログイン・ログアウト
router.use(userAuthentication); // ユーザー認証
router.use('/master/creativeWorks/movie', movieRouter);
router.use('/master/events/screeningEvent', screeningEventMasterRouter);
router.use('/master/events/screeningEventSeries', screeningEventSeriesMasterRouter);
router.use('/master/ticketTypes', ticketTypeMasterRouter); //券種
router.use('/master/ticketTypeGroups', ticketTypeGroupMasterRouter); //券種グループ
router.get('/', IndexController.index);

export default router;
