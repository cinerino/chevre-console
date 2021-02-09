/**
 * アプリケーション特有の型
 */
import * as cinerino from '@cinerino/sdk';
// import * as express from 'express';
// import { ISubscription } from '../factory/subscription';

import User from '../user';
declare global {
    namespace Express {
        // tslint:disable-next-line:interface-name
        export interface Request {
            user: User;
            project: cinerino.factory.project.IProject;
            // subscription?: ISubscription;
        }
    }
}
