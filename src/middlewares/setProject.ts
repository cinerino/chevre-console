/**
 * リクエストプロジェクト設定ルーター
 */
import * as cinerino from '@cinerino/sdk';
import * as express from 'express';

const setProject = express.Router();

// プロジェクト指定ルーティング配下については、すべてreq.projectを上書き
setProject.use(
    '/projects/:id',
    async (req, _, next) => {
        req.project = { typeOf: cinerino.factory.chevre.organizationType.Project, id: req.params.id };

        next();
    }
);

export default setProject;
