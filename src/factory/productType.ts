export enum ProductType {
    EventService = 'EventService',
    MembershipService = 'MembershipService',
    Product = 'Product'
}

export interface IProductType {
    codeValue: string;
    name: string;
}

const types: IProductType[] = [
    { codeValue: ProductType.EventService, name: 'イベント' }
];

if (process.env.USE_OFFER_ADD_ON === '1') {
    types.push(
        { codeValue: ProductType.MembershipService, name: '会員サービス' },
        { codeValue: ProductType.Product, name: 'アドオン' }
    );
}

export const productTypes = types;
