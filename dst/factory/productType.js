"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productTypes = exports.ProductType = void 0;
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
types.push({ codeValue: ProductType.Product, name: 'アドオン' });
const AVAILABLE_PRODUCT_TYPES = (typeof process.env.AVAILABLE_PRODUCT_TYPES === 'string')
    ? process.env.AVAILABLE_PRODUCT_TYPES.split(',')
    : [];
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.MembershipService)) {
    types.push({ codeValue: ProductType.MembershipService, name: 'メンバーシップ' });
}
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.Account)) {
    types.push({ codeValue: ProductType.Account, name: '口座' });
}
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.PaymentCard)) {
    types.push({ codeValue: ProductType.PaymentCard, name: 'ペイメントカード' }
    // { codeValue: ProductType.PointCard, name: 'ポイントカード' }
    );
}
exports.productTypes = types;
