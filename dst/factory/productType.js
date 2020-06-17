"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProductType;
(function (ProductType) {
    ProductType["EventService"] = "EventService";
    // MoneyTransfer = 'MoneyTransfer',
    ProductType["MembershipService"] = "MembershipService";
    ProductType["PaymentCard"] = "PaymentCard";
    ProductType["PointCard"] = "PointCard";
    ProductType["Product"] = "Product";
})(ProductType = exports.ProductType || (exports.ProductType = {}));
const types = [
    { codeValue: ProductType.EventService, name: '予約サービス' }
];
if (process.env.USE_OFFER_ADD_ON === '1') {
    types.push(
    // { codeValue: ProductType.MoneyTransfer, name: '入金サービス' },
    { codeValue: ProductType.MembershipService, name: 'メンバーシップ' }, { codeValue: ProductType.PaymentCard, name: 'ペイメントカード' }, { codeValue: ProductType.PointCard, name: 'ポイントカード' }, { codeValue: ProductType.Product, name: 'アドオン' });
}
exports.productTypes = types;
