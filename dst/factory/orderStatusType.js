"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderStatusTypes = void 0;
const chevre = require("@chevre/api-nodejs-client");
const types = [
    { codeValue: chevre.factory.orderStatus.OrderDelivered, name: 'Delivered' },
    { codeValue: chevre.factory.orderStatus.OrderProcessing, name: 'Processing' },
    { codeValue: chevre.factory.orderStatus.OrderReturned, name: 'Returned' }
];
exports.orderStatusTypes = types;
