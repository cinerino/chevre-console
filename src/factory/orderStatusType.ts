import { chevre } from '@cinerino/sdk';

export interface IOrderStatusType {
    codeValue: chevre.factory.orderStatus;
    name: string;
}

const types: IOrderStatusType[] = [
    { codeValue: chevre.factory.orderStatus.OrderDelivered, name: 'Delivered' },
    { codeValue: chevre.factory.orderStatus.OrderProcessing, name: 'Processing' },
    { codeValue: chevre.factory.orderStatus.OrderReturned, name: 'Returned' }
];

export const orderStatusTypes = types;
