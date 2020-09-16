import * as chevre from '@chevre/api-nodejs-client';

export interface IReservationStatusType {
    codeValue: chevre.factory.reservationStatusType;
    name: string;
}

const types: IReservationStatusType[] = [
    { codeValue: chevre.factory.reservationStatusType.ReservationCancelled, name: 'キャンセル済' },
    { codeValue: chevre.factory.reservationStatusType.ReservationConfirmed, name: '確定' },
    { codeValue: chevre.factory.reservationStatusType.ReservationPending, name: '保留中' }
];

export const reservationStatusTypes = types;
