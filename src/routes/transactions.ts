/**
 * 取引ルーター
 */
// import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import * as express from 'express';
// import * as moment from 'moment';

const debug = createDebug('chevre-console:router');
const transactionsRouter = express.Router();

/**
 * 取引検索
 */
transactionsRouter.get(
    '/',
    async (req, _, next) => {
        try {
            debug('searching transactions...', req.query);
            throw new Error('Not implemented');
        } catch (error) {
            next(error);
        }
    });

/**
 * 予約取引開始
 */
transactionsRouter.all(
    '/reserve/start',
    async (req, res, next) => {
        try {
            let values: any = {};
            let message;
            if (req.method === 'POST') {
                values = req.body;

                try {
                    // const reserveService = new chevre.service.transaction.Reserve({
                    //     endpoint: <string>process.env.API_ENDPOINT,
                    //     auth: req.user.authClient
                    // });

                    // debug('取引を開始します...', values);
                    const transaction = { id: 'test' };
                    // const transaction = await depositTransactionService.start({
                    //     project: req.project,
                    //     typeOf: pecorinoapi.factory.transactionType.Deposit,
                    //     expires: moment().add(1, 'minutes').toDate(),
                    //     agent: {
                    //         typeOf: 'Organization',
                    //         id: 'agent-id',
                    //         name: values.fromName,
                    //         url: ''
                    //     },
                    //     recipient: {
                    //         typeOf: 'Person',
                    //         id: 'recipient-id',
                    //         name: 'recipient name',
                    //         url: ''
                    //     },
                    //     object: {
                    //         amount: Number(values.amount),
                    //         description: values.description,
                    //         toLocation: {
                    //             typeOf: pecorinoapi.factory.account.TypeOf.Account,
                    //             accountType: values.accountType,
                    //             accountNumber: values.toAccountNumber
                    //         }
                    //     }
                    // });
                    // debug('取引が開始されました。', transaction.id);
                    // // セッションに取引追加
                    // (<Express.Session>req.session)[`transaction:${transaction.id}`] = transaction;

                    res.redirect(`/transactions/reserve/${transaction.id}/confirm`);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }

            res.render('transactions/reserve/start', {
                values: values,
                message: message
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 予約取引確認
 */
transactionsRouter.all(
    '/reserve/:transactionId/confirm',
    async (req, res, next) => {
        try {
            let message;
            // let toAccount: pecorinoapi.factory.account.IAccount<pecorinoapi.factory.account.AccountType> | undefined;
            // const transaction = <pecorinoapi.factory.transaction.deposit.ITransaction<pecorinoapi.factory.account.AccountType>>
            //     (<Express.Session>req.session)[`transaction:${req.params.transactionId}`];
            // if (transaction === undefined) {
            //     throw new pecorinoapi.factory.errors.NotFound('Transaction in session');
            // }
            const transaction = { id: 'test' };

            if (req.method === 'POST') {
                // 確定
                // const reserveService = new chevre.service.transaction.Reserve({
                //     endpoint: <string>process.env.API_ENDPOINT,
                //     auth: req.user.authClient
                // });
                // await depositTransactionService.confirm(transaction);
                debug('取引確定です。');
                message = '予約取引を実行しました。';
                // セッション削除
                // delete (<Express.Session>req.session)[`transaction:${req.params.transactionId}`];
                req.flash('message', '入金取引を実行しました。');
                res.redirect(`/transactions/reserve/start`);

                return;
            } else {
                // 入金先口座情報を検索
                // const accountService = new pecorinoapi.service.Account({
                //     endpoint: <string>process.env.API_ENDPOINT,
                //     auth: req.user.authClient
                // });
                // const searchAccountsResult = await accountService.search({
                //     accountType: transaction.object.toLocation.accountType,
                //     accountNumbers: [transaction.object.toLocation.accountNumber],
                //     statuses: [],
                //     limit: 1
                // });
                // toAccount = searchAccountsResult.data.shift();
                // if (toAccount === undefined) {
                //     throw new Error('To Location Not Found');
                // }
            }

            res.render('transactions/reserve/confirm', {
                transaction: transaction,
                message: message
                // toAccount: toAccount
            });
        } catch (error) {
            next(error);
        }
    }
);

export default transactionsRouter;
