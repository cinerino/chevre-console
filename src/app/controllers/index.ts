/**
 * インデックスコントローラー
 *
 * @namespace controller/index
 */

import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { MOVED_PERMANENTLY } from 'http-status';

const debug = createDebug('chevre-backend:*');

export function index(req: Request, res: Response, next: NextFunction) {
    debug('query:', req.query);
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));

        return;
    }

    res.redirect(MOVED_PERMANENTLY, 'master/event/screeningEvents');
}
