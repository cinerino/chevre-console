/**
 * サービスルーター
 */
import * as express from 'express';

import membershipServiceRouter from './services/membershipService';
import paymentCardRouter from './services/paymentCard';

const servicesRouter = express.Router();

servicesRouter.use('/membershipService', membershipServiceRouter);
servicesRouter.use('/paymentCard', paymentCardRouter);

export default servicesRouter;
