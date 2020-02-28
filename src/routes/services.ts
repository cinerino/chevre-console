/**
 * サービスルーター
 */
import * as express from 'express';

import membershipServiceRouter from './services/membershipService';

const servicesRouter = express.Router();

servicesRouter.use('/membershipService', membershipServiceRouter);

export default servicesRouter;
