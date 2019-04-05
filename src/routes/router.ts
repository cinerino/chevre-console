/**
 * デフォルトルーター
 */
import * as express from 'express';

import authentication from '../middlewares/authentication';

import accountTitlesRouter from './accountTitles';
import authRouter from './auth';
import movieRouter from './creativeWork/movie';
import screeningEventRouter from './event/screeningEvent';
import screeningEventSeriesRouter from './event/screeningEventSeries';
import movieTheaterRouter from './places/movieTheater';
import priceSpecificationsRouter from './priceSpecifications';
import reservationsRouter from './reservations';
import serviceTypesRouter from './serviceTypes';
import ticketTypeMasterRouter from './ticketType';
import ticketTypeGroupMasterRouter from './ticketTypeGroup';

const router = express.Router();
router.use(authRouter);
router.use(authentication);
router.use('/accountTitles', accountTitlesRouter);
router.use('/creativeWorks/movie', movieRouter);
router.use('/events/screeningEvent', screeningEventRouter);
router.use('/events/screeningEventSeries', screeningEventSeriesRouter);
router.use('/places/movieTheater', movieTheaterRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/reservations', reservationsRouter);
router.use('/serviceTypes', serviceTypesRouter);
router.use('/ticketTypes', ticketTypeMasterRouter);
router.use('/ticketTypeGroups', ticketTypeGroupMasterRouter);

router.get('/', (req, res, next) => {
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));

        return;
    }

    res.redirect('/creativeWorks/movie');
});

export default router;
