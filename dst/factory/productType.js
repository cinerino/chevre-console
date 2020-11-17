"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productTypes = exports.ProductType = void 0;
const api_nodejs_client_1 = require("@chevre/api-nodejs-client");
exports.ProductType = api_nodejs_client_1.factory.product.ProductType;
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
if (AVAILABLE_PRODUCT_TYPES.includes(exports.ProductType.PaymentCard)) {
    types.push({ codeValue: exports.ProductType.PaymentCard, name: 'ペイメントカード' });
}
exports.productTypes = types;
