"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryCodeSets = void 0;
const sdk_1 = require("@cinerino/sdk");
const sets = [
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.AccountType, name: '通貨区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType, name: 'レイティング区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.DistributorType, name: '配給区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType, name: '決済カード(ムビチケ券種)区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType, name: 'オファーカテゴリー区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.PaymentMethodType, name: '決済方法区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.SeatingType, name: '座席区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.ServiceType, name: 'サービス区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType, name: '音響方式区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType, name: '上映方式区分' },
    { identifier: sdk_1.chevre.factory.categoryCode.CategorySetIdentifier.MembershipType, name: 'メンバーシップ区分' }
];
exports.categoryCodeSets = sets;
