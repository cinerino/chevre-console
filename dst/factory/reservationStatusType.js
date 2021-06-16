"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationStatusTypes = void 0;
const sdk_1 = require("@cinerino/sdk");
const types = [
    { codeValue: sdk_1.chevre.factory.reservationStatusType.ReservationCancelled, name: '取消' },
    { codeValue: sdk_1.chevre.factory.reservationStatusType.ReservationConfirmed, name: '確定' },
    { codeValue: sdk_1.chevre.factory.reservationStatusType.ReservationPending, name: '保留' }
];
exports.reservationStatusTypes = types;
