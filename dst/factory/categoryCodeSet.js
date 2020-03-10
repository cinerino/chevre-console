"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chevre = require("@chevre/api-nodejs-client");
const sets = [
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.AccountType, name: '口座区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.ContentRatingType, name: 'レイティング区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType, name: '配給区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.MovieTicketType, name: 'ムビチケ券種区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType, name: 'オファーカテゴリー区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.SeatingType, name: '座席区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType, name: 'サービス区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.SoundFormatType, name: '音響方式区分' },
    { identifier: chevre.factory.categoryCode.CategorySetIdentifier.VideoFormatType, name: '上映方式区分' }
];
exports.categoryCodeSets = sets;
