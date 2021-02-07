/**
 * デフォルトルーター
 */
import * as express from 'express';

import authentication from '../middlewares/authentication';
import setProject from '../middlewares/setProject';

import authRouter from './auth';
import dashboardRouter from './dashboard';
import projectsRouter from './projects';
import projectDetailRouter from './projects/detail';

const USE_PROJECTLESS_ROUTER = process.env.USE_PROJECTLESS_ROUTER === '1';

const router = express.Router();

router.use(authRouter);
router.use(authentication);

// ダッシュボード
router.use('/', dashboardRouter);

// リクエストプロジェクト設定
router.use(setProject);

// プロジェクトルーター
router.use('/projects', projectsRouter);

// 以下、プロジェクト指定済の状態でルーティング
if (USE_PROJECTLESS_ROUTER) {
    router.use('', projectDetailRouter);
}
router.use('/projects/:id', projectDetailRouter);

export default router;
