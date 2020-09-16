import * as chevre from '@chevre/api-nodejs-client';

export import ProductType = chevre.factory.product.ProductType;

export interface IProductType {
    codeValue: string;
    name: string;
}

const types: IProductType[] = [
    { codeValue: ProductType.EventService, name: '予約サービス' },
    { codeValue: ProductType.Product, name: 'アドオン' }
];

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
