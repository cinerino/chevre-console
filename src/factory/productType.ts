export enum ProductType {
    Account = 'Account',
    EventService = 'EventService',
    MembershipService = 'MembershipService',
    PaymentCard = 'PaymentCard',
    // PointCard = 'PointCard',
    Product = 'Product'
}

export interface IProductType {
    codeValue: string;
    name: string;
}

const types: IProductType[] = [
    { codeValue: ProductType.EventService, name: '予約サービス' }
];

if (process.env.USE_OFFER_ADD_ON === '1') {
    types.push(
        { codeValue: ProductType.Product, name: 'アドオン' },
        { codeValue: ProductType.MembershipService, name: 'メンバーシップ' },
        { codeValue: ProductType.Account, name: '口座' },
        { codeValue: ProductType.PaymentCard, name: 'ペイメントカード' }
        // { codeValue: ProductType.PointCard, name: 'ポイントカード' }
    );
}

export const productTypes = types;
