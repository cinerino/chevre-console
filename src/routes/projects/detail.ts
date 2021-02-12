/**
 * プロジェクト詳細ルーター
 */
import * as express from 'express';

import accountTitlesRouter from '../accountTitles';
import actionsRouter from '../actions';
import applicationsRouter from '../applications';
import categoryCodesRouter from '../categoryCode';
import creativeWorksRouter from '../creativeWorks';
import screeningEventRouter from '../event/screeningEvent';
import screeningEventSeriesRouter from '../event/screeningEventSeries';
import homeRouter from '../home';
import offerCatalogsRouter from '../offerCatalogs';
import offersRouter from '../offers';
import paymentServicesRouter from '../paymentServices';
import movieTheaterRouter from '../places/movieTheater';
import screeningRoomRouter from '../places/screeningRoom';
import screeningRoomSectionRouter from '../places/screeningRoomSection';
import seatRouter from '../places/seat';
import priceSpecificationsRouter from '../priceSpecifications';
import productsRouter from '../products';
import reservationsRouter from '../reservations';
import sellersRouter from '../sellers';
import settingsRouter from '../settings';
import ticketTypeMasterRouter from '../ticketType';
import transactionsRouter from '../transactions';

const projectDetailRouter = express.Router();

projectDetailRouter.use('/home', homeRouter);
projectDetailRouter.use('/accountTitles', accountTitlesRouter);
projectDetailRouter.use('/actions', actionsRouter);
projectDetailRouter.use('/applications', applicationsRouter);
projectDetailRouter.use('/categoryCodes', categoryCodesRouter);
projectDetailRouter.use('/creativeWorks', creativeWorksRouter);
projectDetailRouter.use('/events/screeningEvent', screeningEventRouter);
projectDetailRouter.use('/events/screeningEventSeries', screeningEventSeriesRouter);
projectDetailRouter.use('/offerCatalogs', offerCatalogsRouter);
projectDetailRouter.use('/offers', offersRouter);
projectDetailRouter.use('/paymentServices', paymentServicesRouter);
projectDetailRouter.use('/places/movieTheater', movieTheaterRouter);
projectDetailRouter.use('/places/screeningRoom', screeningRoomRouter);
projectDetailRouter.use('/places/screeningRoomSection', screeningRoomSectionRouter);
projectDetailRouter.use('/places/seat', seatRouter);
projectDetailRouter.use('/priceSpecifications', priceSpecificationsRouter);
projectDetailRouter.use('/products', productsRouter);
projectDetailRouter.use('/reservations', reservationsRouter);
projectDetailRouter.use('/sellers', sellersRouter);
projectDetailRouter.use('/settings', settingsRouter);
projectDetailRouter.use('/ticketTypes', ticketTypeMasterRouter);
projectDetailRouter.use('/transactions', transactionsRouter);

export default projectDetailRouter;
