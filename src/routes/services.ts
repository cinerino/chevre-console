/**
 * サービスルーター
 */
import * as express from 'express';

import membershipProgramRouter from './services/membershipProgram';

const servicesRouter = express.Router();

servicesRouter.use('/membershipProgram', membershipProgramRouter);

export default servicesRouter;
