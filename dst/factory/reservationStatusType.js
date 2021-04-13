"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationStatusTypes = void 0;
const chevre = require("@chevre/api-nodejs-client");
const types = [
    { codeValue: chevre.factory.reservationStatusType.ReservationCancelled, name: '取消' },
    { codeValue: chevre.factory.reservationStatusType.ReservationConfirmed, name: '確定' },
    { codeValue: chevre.factory.reservationStatusType.ReservationPending, name: '保留' }
];
exports.reservationStatusTypes = types;
