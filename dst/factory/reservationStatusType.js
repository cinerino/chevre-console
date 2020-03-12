"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chevre = require("@chevre/api-nodejs-client");
const types = [
    { codeValue: chevre.factory.reservationStatusType.ReservationCancelled, name: 'キャンセル済' },
    { codeValue: chevre.factory.reservationStatusType.ReservationConfirmed, name: '確定' },
    { codeValue: chevre.factory.reservationStatusType.ReservationPending, name: '保留中' }
];
exports.reservationStatusTypes = types;
