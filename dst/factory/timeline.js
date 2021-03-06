"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFromAction = void 0;
const sdk_1 = require("@cinerino/sdk");
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function createFromAction(params) {
    var _a, _b, _c;
    const a = params.action;
    let agent = {
        id: '',
        name: 'Unknown'
    };
    if (a.agent !== undefined && a.agent !== null) {
        switch (a.agent.typeOf) {
            case sdk_1.chevre.factory.personType.Person:
            case sdk_1.chevre.factory.creativeWorkType.WebApplication:
                let userPoolId = '';
                let tokenIssuer = '';
                if (Array.isArray(a.agent.identifier)) {
                    const tokenIssuerIdentifier = a.agent.identifier.find((i) => i.name === 'tokenIssuer');
                    if (tokenIssuerIdentifier !== undefined) {
                        tokenIssuer = tokenIssuerIdentifier.value;
                        userPoolId = tokenIssuer.replace('https://cognito-idp.ap-northeast-1.amazonaws.com/', '');
                    }
                }
                const url = `/projects/${params.project.id}/resources/${a.agent.typeOf}/${a.agent.id}?userPoolId=${userPoolId}`;
                let agentName = (typeof a.agent.id === 'string') ? a.agent.id : a.agent.typeOf;
                if (a.agent.name !== undefined) {
                    agentName = a.agent.name;
                }
                else {
                    if (a.agent.familyName !== undefined) {
                        agentName = `${a.agent.givenName} ${a.agent.familyName}`;
                    }
                }
                agent = {
                    id: String(a.agent.id),
                    name: agentName,
                    url: url
                };
                break;
            case sdk_1.chevre.factory.chevre.organizationType.MovieTheater:
            case sdk_1.chevre.factory.chevre.organizationType.Corporation:
                agent = {
                    id: String(a.agent.id),
                    name: (typeof a.agent.name === 'string') ? a.agent.name : String((_a = a.agent.name) === null || _a === void 0 ? void 0 : _a.ja),
                    url: `/projects/${params.project.id}/sellers/${a.agent.id}`
                };
                break;
            default:
                agent = {
                    id: a.agent.id,
                    name: (a.agent.name !== undefined && a.agent.name !== null)
                        ? (typeof a.agent.name === 'string') ? a.agent.name : a.agent.name.ja
                        : ''
                };
        }
    }
    let recipient;
    if (a.recipient !== undefined && a.recipient !== null) {
        switch (a.recipient.typeOf) {
            case sdk_1.chevre.factory.personType.Person:
            case sdk_1.chevre.factory.creativeWorkType.WebApplication:
                let userPoolId = '';
                let tokenIssuer = '';
                if (Array.isArray(a.recipient.identifier)) {
                    const tokenIssuerIdentifier = a.recipient.identifier.find((i) => i.name === 'tokenIssuer');
                    if (tokenIssuerIdentifier !== undefined) {
                        tokenIssuer = tokenIssuerIdentifier.value;
                        userPoolId = tokenIssuer.replace('https://cognito-idp.ap-northeast-1.amazonaws.com/', '');
                    }
                }
                const url = `/projects/${params.project.id}/resources/${a.recipient.typeOf}/${a.recipient.id}?userPoolId=${userPoolId}`;
                let recipientName = (typeof a.recipient.url === 'string') ? a.recipient.url
                    : (typeof a.recipient.id === 'string') ? a.recipient.id : a.recipient.typeOf;
                if (a.recipient.name !== undefined) {
                    recipientName = a.recipient.name;
                }
                else {
                    if (a.recipient.familyName !== undefined) {
                        recipientName = `${a.recipient.givenName} ${a.recipient.familyName}`;
                    }
                }
                recipient = {
                    id: String(a.recipient.id),
                    name: recipientName,
                    url: url
                };
                break;
            case sdk_1.chevre.factory.chevre.organizationType.MovieTheater:
            case sdk_1.chevre.factory.chevre.organizationType.Corporation:
                recipient = {
                    id: String(a.recipient.id),
                    name: (typeof a.recipient.name === 'string') ? a.recipient.name : String((_b = a.recipient.name) === null || _b === void 0 ? void 0 : _b.ja),
                    url: (typeof a.recipient.url === 'string') ? a.recipient.url : `/projects/${params.project.id}/sellers/${a.recipient.id}`
                };
                break;
            default:
                recipient = {
                    id: a.recipient.id,
                    name: (a.recipient.name !== undefined && a.recipient.name !== null)
                        ? (typeof a.recipient.name === 'string') ? a.recipient.name : a.recipient.name.ja
                        : (typeof a.recipient.url === 'string') ? a.recipient.url : a.recipient.id,
                    url: a.recipient.url
                };
        }
    }
    let actionName;
    switch (a.typeOf) {
        case sdk_1.chevre.factory.actionType.AuthorizeAction:
            actionName = '承認';
            break;
        case sdk_1.chevre.factory.actionType.CancelAction:
            actionName = 'キャンセル';
            break;
        case sdk_1.chevre.factory.actionType.CheckAction:
            actionName = '確認';
            break;
        case sdk_1.chevre.factory.actionType.ConfirmAction:
            actionName = '確定';
            break;
        case sdk_1.chevre.factory.actionType.DeleteAction:
            actionName = '削除';
            break;
        case sdk_1.chevre.factory.actionType.OrderAction:
            actionName = '注文';
            break;
        case sdk_1.chevre.factory.actionType.GiveAction:
            actionName = '付与';
            break;
        case sdk_1.chevre.factory.actionType.InformAction:
            actionName = '通知';
            break;
        case sdk_1.chevre.factory.actionType.MoneyTransfer:
            actionName = '転送';
            break;
        case sdk_1.chevre.factory.actionType.PayAction:
            actionName = '決済';
            break;
        case sdk_1.chevre.factory.actionType.PrintAction:
            actionName = '印刷';
            break;
        case sdk_1.chevre.factory.actionType.RegisterAction:
            actionName = '登録';
            break;
        case sdk_1.chevre.factory.actionType.ReturnAction:
            if (a.object.typeOf === sdk_1.chevre.factory.order.OrderType.Order) {
                actionName = '返品';
            }
            else {
                actionName = '返却';
            }
            break;
        case sdk_1.chevre.factory.actionType.RefundAction:
            actionName = '返金';
            break;
        case sdk_1.chevre.factory.actionType.SendAction:
            if (a.object.typeOf === sdk_1.chevre.factory.order.OrderType.Order) {
                actionName = '配送';
            }
            else {
                actionName = '送信';
            }
            break;
        case sdk_1.chevre.factory.actionType.UnRegisterAction:
            actionName = '登録解除';
            break;
        default:
            actionName = a.typeOf;
    }
    let object = { name: 'Unknown' };
    try {
        if (a.object !== undefined && a.object !== null) {
            let url;
            if (typeof a.object.typeOf === 'string' && typeof a.object.id === 'string') {
                url = `/projects/${params.project.id}/resources/${a.object.typeOf}/${a.object.id}`;
            }
            object = { name: String(typeof a.object) };
            if (Array.isArray(a.object)) {
                if (typeof ((_c = a.object[0]) === null || _c === void 0 ? void 0 : _c.typeOf) === 'string') {
                    object = { name: a.object[0].typeOf };
                    switch (a.object[0].typeOf) {
                        // case chevre.factory.chevre.offerType.Offer:
                        //     object = { name: `${a.object[0]?.itemOffered?.typeOf} オファー` };
                        //     break;
                        // case 'PaymentMethod':
                        //     object = { name: a.object[0].paymentMethod.name };
                        //     break;
                        // case chevre.factory.actionType.PayAction:
                        //     object = { name: a.object[0].object.paymentMethod.typeOf };
                        //     break;
                        default:
                    }
                }
            }
            else {
                object = { name: a.object.typeOf };
                switch (a.object.typeOf) {
                    // case chevre.factory.chevre.offerType.Offer:
                    //     object = { name: 'オファー' };
                    //     break;
                    // case chevre.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation:
                    //     object = { name: '予約' };
                    //     break;
                    // case chevre.factory.action.transfer.give.pointAward.ObjectType.PointAward:
                    // case chevre.factory.action.authorize.award.point.ObjectType.PointAward:
                    //     object = { name: 'ポイント特典' };
                    //     break;
                    case sdk_1.chevre.factory.order.OrderType.Order:
                        url = `/projects/${params.project.id}/orders/${a.object.orderNumber}`;
                        // object = { name: '注文' };
                        break;
                    // case 'OwnershipInfo':
                    //     object = { name: '所有権' };
                    //     break;
                    // case chevre.factory.creativeWorkType.EmailMessage:
                    //     object = { name: 'Eメール' };
                    //     break;
                    // case 'PaymentMethod':
                    //     object = { name: a.object.object[0].paymentMethod.name };
                    //     break;
                    // case chevre.factory.actionType.PayAction:
                    //     object = { name: a.object.object[0].paymentMethod.typeOf };
                    //     break;
                    // case chevre.factory.chevre.transactionType.Reserve:
                    //     object = { name: '予約取引' };
                    //     break;
                    // case chevre.factory.chevre.transactionType.MoneyTransfer:
                    //     object = { name: '通貨転送取引' };
                    //     break;
                    default:
                    // object = { name: a.object.typeOf };
                }
            }
            object.url = url;
        }
    }
    catch (error) {
        // no op
    }
    if (a.typeOf === sdk_1.chevre.factory.actionType.MoneyTransfer) {
        const amount = a.amount;
        if (typeof amount === 'number') {
            object = { name: String(amount) };
        }
        else {
            object = { name: `${amount.value} ${amount.currency}` };
        }
    }
    let purpose;
    if (Array.isArray(a.purpose)) {
        purpose = { name: 'Array' };
    }
    else if (a.purpose !== undefined && a.purpose !== null) {
        purpose = { name: a.purpose.typeOf };
        switch (a.purpose.typeOf) {
            case sdk_1.chevre.factory.order.OrderType.Order:
                purpose.url = `/projects/${params.project.id}/orders/${a.purpose.orderNumber}`;
                // purpose = {
                //     name: '注文',
                //     url: `/projects/${params.project.id}/orders/${(<any>a.purpose).orderNumber}`
                // };
                break;
            case sdk_1.chevre.factory.transactionType.MoneyTransfer:
            case sdk_1.chevre.factory.transactionType.PlaceOrder:
            case sdk_1.chevre.factory.transactionType.ReturnOrder:
                purpose.url = `/projects/${params.project.id}/transactions/${a.purpose.typeOf}/${a.purpose.id}`;
                // purpose = {
                //     name: '取引',
                //     url: `/projects/${params.project.id}/transactions/${a.purpose.typeOf}/${(<any>a.purpose).id}`
                // };
                break;
            default:
        }
    }
    let result;
    if (a.result !== undefined && a.result !== null) {
        switch (a.typeOf) {
            case sdk_1.chevre.factory.actionType.SendAction:
                if (a.object.typeOf === sdk_1.chevre.factory.order.OrderType.Order) {
                    if (Array.isArray(a.result)) {
                        result = a.result.map((o) => {
                            return {
                                name: '所有権',
                                url: `/projects/${params.project.id}/resources/${o.typeOf}/${o.id}`
                            };
                        });
                    }
                    else if (Array.isArray(a.result.ownershipInfos)) {
                        result = a.result.ownershipInfos.map((o) => {
                            return {
                                name: '所有権',
                                url: `/projects/${params.project.id}/resources/${o.typeOf}/${o.id}`
                            };
                        });
                    }
                }
                break;
            case sdk_1.chevre.factory.actionType.ReturnAction:
                if (a.object.typeOf === sdk_1.chevre.factory.order.OrderType.Order) {
                    if (Array.isArray(a.result)) {
                        result = a.result.map((o) => {
                            return {
                                name: '所有権',
                                url: `/projects/${params.project.id}/resources/${o.typeOf}/${o.id}`
                            };
                        });
                    }
                }
                break;
            case sdk_1.chevre.factory.actionType.AuthorizeAction:
                if (a.object.typeOf === 'OwnershipInfo') {
                    if (typeof a.result.code === 'string') {
                        result = [{
                                name: '所有権コード',
                                url: `/projects/${params.project.id}/authorizations/${a.result.id}`
                            }];
                    }
                }
                break;
            default:
        }
    }
    let actionStatusDescription;
    switch (a.actionStatus) {
        case sdk_1.chevre.factory.actionStatusType.ActiveActionStatus:
            actionStatusDescription = 'しようとしています...';
            break;
        case sdk_1.chevre.factory.actionStatusType.CanceledActionStatus:
            actionStatusDescription = 'しましたが、取り消しました';
            break;
        case sdk_1.chevre.factory.actionStatusType.CompletedActionStatus:
            actionStatusDescription = 'しました';
            break;
        case sdk_1.chevre.factory.actionStatusType.FailedActionStatus:
            actionStatusDescription = 'しようとしましたが、失敗しました';
            break;
        case sdk_1.chevre.factory.actionStatusType.PotentialActionStatus:
            actionStatusDescription = 'する可能性があります';
            break;
        default:
            actionStatusDescription = a.actionStatus;
    }
    return {
        action: a,
        agent,
        recipient,
        actionName,
        object,
        purpose,
        startDate: a.startDate,
        actionStatus: a.actionStatus,
        actionStatusDescription: actionStatusDescription,
        result
    };
}
exports.createFromAction = createFromAction;
