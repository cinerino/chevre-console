"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productTypes = exports.UnitCode = void 0;
const api_nodejs_client_1 = require("@chevre/api-nodejs-client");
exports.UnitCode = api_nodejs_client_1.factory.unitCode;
const types = [
    { codeValue: ProductType.EventService, name: '予約サービス' },
    { codeValue: ProductType.Product, name: 'アドオン' }
];
const AVAILABLE_PRODUCT_TYPES = (typeof process.env.AVAILABLE_PRODUCT_TYPES === 'string')
    ? process.env.AVAILABLE_PRODUCT_TYPES.split(',')
    : [];
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.MembershipService)) {
    types.push({ codeValue: ProductType.MembershipService, name: 'メンバーシップ' });
}
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.PaymentCard)) {
    types.push({ codeValue: ProductType.PaymentCard, name: 'ペイメントカード' });
}
exports.productTypes = types;
