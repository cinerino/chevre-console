"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderStatusTypes = void 0;
const sdk_1 = require("@cinerino/sdk");
const types = [
    { codeValue: sdk_1.chevre.factory.orderStatus.OrderDelivered, name: 'Delivered' },
    { codeValue: sdk_1.chevre.factory.orderStatus.OrderProcessing, name: 'Processing' },
    { codeValue: sdk_1.chevre.factory.orderStatus.OrderReturned, name: 'Returned' }
];
exports.orderStatusTypes = types;
