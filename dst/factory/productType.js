"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProductType;
(function (ProductType) {
    ProductType["EventService"] = "EventService";
    ProductType["MoneyTransfer"] = "MoneyTransfer";
    ProductType["MembershipService"] = "MembershipService";
    ProductType["PaymentCard"] = "PaymentCard";
    ProductType["Product"] = "Product";
})(ProductType = exports.ProductType || (exports.ProductType = {}));
const types = [
    { codeValue: ProductType.EventService, name: 'イベント' }
];
if (process.env.USE_OFFER_ADD_ON === '1') {
    types.push({ codeValue: ProductType.MoneyTransfer, name: '入金サービス' }, { codeValue: ProductType.MembershipService, name: '会員サービス' }, { codeValue: ProductType.PaymentCard, name: '決済カード' }, { codeValue: ProductType.Product, name: 'アドオン' });
}
exports.productTypes = types;
