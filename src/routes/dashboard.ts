/**
 * ダッシュボードルーター
 */
// import * as chevre from '@chevre/api-nodejs-client';
import { Router } from 'express';
// import { INTERNAL_SERVER_ERROR } from 'http-status';
// import * as moment from 'moment-timezone';

const dashboardRouter = Router();

dashboardRouter.get(
    '',
    async (req, res, next) => {
        if (req.query.next !== undefined) {
            next(new Error(req.param('next')));

            return;
        }

        res.redirect('/home');
        // res.render(
        //     'index',
        //     {}
        // );
    }
);

export default dashboardRouter;
