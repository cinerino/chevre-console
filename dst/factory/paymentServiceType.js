"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentServiceTypes = void 0;
const sdk_1 = require("@cinerino/sdk");
const types = [
    { codeValue: sdk_1.chevre.factory.service.paymentService.PaymentServiceType.CreditCard, name: 'クレジットカードIF' },
    { codeValue: sdk_1.chevre.factory.service.paymentService.PaymentServiceType.MovieTicket, name: 'ムビチケIF' }
];
exports.paymentServiceTypes = types;
