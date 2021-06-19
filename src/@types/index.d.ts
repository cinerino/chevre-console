/**
 * アプリケーション特有の型
 */
import { chevre } from '@cinerino/sdk';
// import * as express from 'express';
// import { ISubscription } from '../factory/subscription';

import User from '../user';
declare global {
    namespace Express {
        // tslint:disable-next-line:interface-name
        export interface Request {
            user: User;
            project: chevre.factory.project.IProject;
            // subscription?: ISubscription;
        }
    }
}
