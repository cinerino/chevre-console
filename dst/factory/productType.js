"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProductType;
(function (ProductType) {
    ProductType["Account"] = "Account";
    ProductType["EventService"] = "EventService";
    ProductType["MembershipService"] = "MembershipService";
    ProductType["PaymentCard"] = "PaymentCard";
    // PointCard = 'PointCard',
    ProductType["Product"] = "Product";
})(ProductType = exports.ProductType || (exports.ProductType = {}));
const types = [
    { codeValue: ProductType.EventService, name: '予約サービス' }
];
if (process.env.USE_OFFER_ADD_ON === '1') {
    types.push({ codeValue: ProductType.Product, name: 'アドオン' }, { codeValue: ProductType.MembershipService, name: 'メンバーシップ' }, { codeValue: ProductType.Account, name: '口座' }, { codeValue: ProductType.PaymentCard, name: 'ペイメントカード' }
    // { codeValue: ProductType.PointCard, name: 'ポイントカード' }
    );
}
exports.productTypes = types;
