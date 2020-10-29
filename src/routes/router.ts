/**
 * デフォルトルーター
 */
import * as express from 'express';
import { ISubscription } from '../factory/subscription';

// tslint:disable-next-line:no-require-imports no-var-requires
const subscriptions: ISubscription[] = require('../../subscriptions.json');

import authentication from '../middlewares/authentication';

import accountTitlesRouter from './accountTitles';
import actionsRouter from './actions';
import applicationsRouter from './applications';
import authRouter from './auth';
import categoryCodesRouter from './categoryCode';
import creativeWorksRouter from './creativeWorks';
import dashboardRouter from './dashboard';
import screeningEventRouter from './event/screeningEvent';
import screeningEventSeriesRouter from './event/screeningEventSeries';
import homeRouter from './home';
import offerCatalogsRouter from './offerCatalogs';
import offersRouter from './offers';
import paymentServicesRouter from './paymentServices';
import movieTheaterRouter from './places/movieTheater';
import screeningRoomRouter from './places/screeningRoom';
import screeningRoomSectionRouter from './places/screeningRoomSection';
import seatRouter from './places/seat';
import priceSpecificationsRouter from './priceSpecifications';
import productsRouter from './products';
import projectsRouter from './projects';
import reservationsRouter from './reservations';
import sellersRouter from './sellers';
import ticketTypeMasterRouter from './ticketType';
import transactionsRouter from './transactions';

const router = express.Router();

router.use(authRouter);
router.use(authentication);

router.use('/', dashboardRouter);

// プロジェクト決定
router.use((req, res, next) => {
    // セッションにプロジェクトIDがあればリクエストプロジェクトに設定
    if (typeof (<any>req.session).project?.id === 'string') {
        req.project = (<any>req.session).project;

        const subscriptionIdentifier = (<any>req.session).subscriptionIdentifier;
        const subscription = subscriptions.find((s) => s.identifier === subscriptionIdentifier);
        req.subscription = subscription;
    } else {
        res.redirect('/');

        return;
    }

    next();
});

router.use('/home', homeRouter);
router.use('/accountTitles', accountTitlesRouter);
router.use('/actions', actionsRouter);
router.use('/applications', applicationsRouter);
router.use('/categoryCodes', categoryCodesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/events/screeningEvent', screeningEventRouter);
router.use('/events/screeningEventSeries', screeningEventSeriesRouter);
router.use('/offerCatalogs', offerCatalogsRouter);
router.use('/offers', offersRouter);
router.use('/paymentServices', paymentServicesRouter);
router.use('/places/movieTheater', movieTheaterRouter);
router.use('/places/screeningRoom', screeningRoomRouter);
router.use('/places/screeningRoomSection', screeningRoomSectionRouter);
router.use('/places/seat', seatRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/products', productsRouter);
router.use('/projects', projectsRouter);
router.use('/reservations', reservationsRouter);
router.use('/sellers', sellersRouter);
router.use('/ticketTypes', ticketTypeMasterRouter);
router.use('/transactions', transactionsRouter);

export default router;
