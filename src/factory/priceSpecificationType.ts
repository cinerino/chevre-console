import * as chevre from '@chevre/api-nodejs-client';

export interface IPriceSpecificationType {
    codeValue: chevre.factory.priceSpecificationType;
    name: string;
}

const types: IPriceSpecificationType[] = [
    { codeValue: chevre.factory.priceSpecificationType.CategoryCodeChargeSpecification, name: '区分加算料金' },
    { codeValue: chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification, name: 'ムビチケ加算料金' }
];

export const priceSpecificationTypes = types;
