"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProductType;
(function (ProductType) {
    ProductType["EventService"] = "EventService";
    ProductType["MembershipService"] = "MembershipService";
    ProductType["Product"] = "Product";
})(ProductType = exports.ProductType || (exports.ProductType = {}));
const types = [
    { codeValue: ProductType.EventService, name: 'イベント' }
];
if (process.env.USE_OFFER_ADD_ON === '1') {
    types.push({ codeValue: ProductType.MembershipService, name: '会員サービス' }, { codeValue: ProductType.Product, name: 'アドオン' });
}
exports.productTypes = types;
