/**
 * カテゴリーコード分類ルーター
 */
import { Router } from 'express';

import { categoryCodeSets } from '../factory/categoryCodeSet';

const categoryCodeSetsRouter = Router();

categoryCodeSetsRouter.get(
    '',
    async (_, res) => {
        res.json(categoryCodeSets);
    }
);

export default categoryCodeSetsRouter;
