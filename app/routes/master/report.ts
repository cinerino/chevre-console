/**
 * レポート出力管理ルーター
 *
 * @desc reportRouter
 * @ignore
 */

import { Router } from 'express';
import * as reportController from '../../controllers/master/report';

const reportMasterRouter = Router();

// 売り上げレポート出力
reportMasterRouter.get('', reportController.index);
reportMasterRouter.get('/getSales', reportController.getSales);
// アカウント別レポート出力

export default reportMasterRouter;
