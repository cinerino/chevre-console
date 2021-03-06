import { chevre } from '@cinerino/sdk';

export interface IPaymentServiceType {
    codeValue: string;
    name: string;
}

const types: IPaymentServiceType[] = [
    { codeValue: chevre.factory.service.paymentService.PaymentServiceType.CreditCard, name: 'クレジットカードIF' },
    { codeValue: chevre.factory.service.paymentService.PaymentServiceType.MovieTicket, name: 'ムビチケIF' }
];

export const paymentServiceTypes = types;
