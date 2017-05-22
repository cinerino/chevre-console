/**
 * ユーザー認証ルーター
 *
 * @function authRouter
 * @ignore
 */

import { Router } from 'express';
import * as masterAuthController from '../../controllers/master/auth';

const authMasterRouter = Router();

// ログイン・ログアウト
authMasterRouter.all('/master/login', masterAuthController.login);
//'master.logout
authMasterRouter.all('/master/logout', masterAuthController.logout);

export default authMasterRouter;
