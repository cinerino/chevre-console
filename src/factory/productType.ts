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
        { codeValue: ProductType.Product, name: 'アドオン' }
    );
}

const AVAILABLE_PRODUCT_TYPES = (typeof process.env.AVAILABLE_PRODUCT_TYPES === 'string')
    ? process.env.AVAILABLE_PRODUCT_TYPES.split(',')
    : [];

if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.MembershipService)) {
    types.push(
        { codeValue: ProductType.MembershipService, name: 'メンバーシップ' }
    );
}
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.Account)) {
    types.push(
        { codeValue: ProductType.Account, name: '口座' }
    );
}
if (AVAILABLE_PRODUCT_TYPES.includes(ProductType.PaymentCard)) {
    types.push(
        { codeValue: ProductType.PaymentCard, name: 'ペイメントカード' }
        // { codeValue: ProductType.PointCard, name: 'ポイントカード' }
    );
}

export const productTypes = types;
