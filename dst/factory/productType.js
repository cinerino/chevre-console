"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productTypes = exports.ProductType = void 0;
const chevre = require("@chevre/api-nodejs-client");
exports.ProductType = chevre.factory.product.ProductType;
const types = [
    { codeValue: exports.ProductType.EventService, name: '予約サービス' },
    { codeValue: exports.ProductType.Product, name: 'アドオン' }
];
const AVAILABLE_PRODUCT_TYPES = (typeof process.env.AVAILABLE_PRODUCT_TYPES === 'string')
    ? process.env.AVAILABLE_PRODUCT_TYPES.split(',')
    : [];
if (AVAILABLE_PRODUCT_TYPES.includes(exports.ProductType.MembershipService)) {
    types.push({ codeValue: exports.ProductType.MembershipService, name: 'メンバーシップ' });
}
if (AVAILABLE_PRODUCT_TYPES.includes(exports.ProductType.Account)) {
    types.push({ codeValue: exports.ProductType.Account, name: '口座' });
}
if (AVAILABLE_PRODUCT_TYPES.includes(exports.ProductType.PaymentCard)) {
    types.push({ codeValue: exports.ProductType.PaymentCard, name: 'ペイメントカード' }
    // { codeValue: ProductType.PointCard, name: 'ポイントカード' }
    );
}
exports.productTypes = types;
