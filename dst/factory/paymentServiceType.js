"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentServiceTypes = void 0;
const chevre = require("@chevre/api-nodejs-client");
const types = [
    { codeValue: chevre.factory.service.paymentService.PaymentServiceType.CreditCard, name: 'クレジットカードIF' },
    { codeValue: chevre.factory.service.paymentService.PaymentServiceType.MovieTicket, name: 'ムビチケIF' }
];
exports.paymentServiceTypes = types;
