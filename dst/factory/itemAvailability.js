"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemAvailabilities = void 0;
const sdk_1 = require("@cinerino/sdk");
const availabilities = [
    { codeValue: sdk_1.chevre.factory.itemAvailability.InStock, name: '在庫あり' },
    { codeValue: sdk_1.chevre.factory.itemAvailability.InStoreOnly, name: '店舗のみ' },
    { codeValue: sdk_1.chevre.factory.itemAvailability.OnlineOnly, name: 'オンラインのみ' },
    { codeValue: sdk_1.chevre.factory.itemAvailability.OutOfStock, name: '在庫なし' }
];
exports.itemAvailabilities = availabilities;
