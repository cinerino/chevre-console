/**
 * デフォルトルーター
 */
import * as express from 'express';

import authentication from '../middlewares/authentication';

import accountTitlesRouter from './accountTitles';
import authRouter from './auth';
import movieRouter from './creativeWork/movie';
import dashboardRouter from './dashboard';
import screeningEventRouter from './event/screeningEvent';
import screeningEventSeriesRouter from './event/screeningEventSeries';
import homeRouter from './home';
import movieTheaterRouter from './places/movieTheater';
import priceSpecificationsRouter from './priceSpecifications';
import productOffersRouter from './productOffer';
import reservationsRouter from './reservations';
import serviceTypesRouter from './serviceTypes';
import ticketTypeMasterRouter from './ticketType';
import ticketTypeGroupMasterRouter from './ticketTypeGroup';

const router = express.Router();

router.use(authRouter);
router.use(authentication);

router.use('/', dashboardRouter);

// プロジェクト決定
router.use((req, res, next) => {
    // セッションにプロジェクトIDがあればリクエストプロジェクトに設定
    if (typeof (<any>req.session).projectId === 'string') {
        req.project = {
            typeOf: 'Project',
            id: (<any>req.session).projectId
        };
    } else {
        res.redirect('/');

        return;
    }

    next();
});

router.use('/home', homeRouter);
router.use('/accountTitles', accountTitlesRouter);
router.use('/creativeWorks/movie', movieRouter);
router.use('/events/screeningEvent', screeningEventRouter);
router.use('/events/screeningEventSeries', screeningEventSeriesRouter);
router.use('/places/movieTheater', movieTheaterRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/productOffers', productOffersRouter);
router.use('/reservations', reservationsRouter);
router.use('/serviceTypes', serviceTypesRouter);
router.use('/ticketTypes', ticketTypeMasterRouter);
router.use('/ticketTypeGroups', ticketTypeGroupMasterRouter);

export default router;
