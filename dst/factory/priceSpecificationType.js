"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceSpecificationTypes = void 0;
const chevre = require("@chevre/api-nodejs-client");
const types = [
    { codeValue: chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification, name: '区分加算料金' },
    { codeValue: chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification, name: '決済カード(ムビチケ)加算料金' }
];
exports.priceSpecificationTypes = types;
