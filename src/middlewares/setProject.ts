/**
 * リクエストプロジェクト設定ルーター
 */
import * as cinerino from '@cinerino/sdk';
import * as express from 'express';
// import { ISubscription } from '../factory/subscription';

// tslint:disable-next-line:no-require-imports no-var-requires
// const subscriptions: ISubscription[] = require('../../subscriptions.json');

const setProject = express.Router();

// setProject.use(async (req, res, next) => {
//     // セッションにプロジェクトIDがあればリクエストプロジェクトに設定
//     if (typeof (<any>req.session).project?.id === 'string') {
//         req.project = (<any>req.session).project;

//         let subscriptionIdentifier = (<any>req.session).subscriptionIdentifier;
//         if (typeof subscriptionIdentifier !== 'string') {
//             subscriptionIdentifier = 'Free';
//         }
//         const subscription = subscriptions.find((s) => s.identifier === subscriptionIdentifier);
//         req.subscription = subscription;
//     } else {
//         res.redirect('/');

//         return;
//     }

//     next();
// });

// プロジェクト指定ルーティング配下については、すべてreq.projectを上書き
setProject.use(
    '/projects/:id',
    async (req, _, next) => {
        req.project = { typeOf: cinerino.factory.chevre.organizationType.Project, id: req.params.id };

        next();
    }
);

export default setProject;
