"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 価格仕様ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const reserve_api_abstract_client_1 = require("@movieticket/reserve-api-abstract-client");
const express_1 = require("express");
const priceSpecificationsRouter = express_1.Router();
priceSpecificationsRouter.get('', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const priceSpecificationService = new chevre.service.PriceSpecification({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchVideoFormatCompoundPriceSpecificationsResult = yield priceSpecificationService.searchCompoundPriceSpecifications({
        limit: 1,
        page: 1,
        typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
        priceComponent: { typeOf: chevre.factory.priceSpecificationType.VideoFormatChargeSpecification }
    });
    const searchSoundFormatCompoundPriceSpecificationsResult = yield priceSpecificationService.searchCompoundPriceSpecifications({
        limit: 1,
        page: 1,
        typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
        priceComponent: { typeOf: chevre.factory.priceSpecificationType.SoundFormatChargeSpecification }
    });
    const searchMovieTicketTypeChargeCompoundPriceSpecificationsResult = yield priceSpecificationService.searchCompoundPriceSpecifications({
        limit: 1,
        page: 1,
        typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
        priceComponent: { typeOf: chevre.factory.priceSpecificationType.MovieTicketTypeChargeSpecification }
    });
    const movieTicketTypeChargeSpecifications = searchMovieTicketTypeChargeCompoundPriceSpecificationsResult.data[0].priceComponent;
    const movieTicketTypeCodes = Array.from(new Set(movieTicketTypeChargeSpecifications.map((s) => s.appliesToMovieTicketType)));
    res.render('priceSpecifications/index', {
        message: '',
        videoFormaChargeSpecifications: searchVideoFormatCompoundPriceSpecificationsResult.data[0].priceComponent,
        soundFormaChargeSpecifications: searchSoundFormatCompoundPriceSpecificationsResult.data[0].priceComponent,
        movieTicketTypeChargeSpecifications: searchMovieTicketTypeChargeCompoundPriceSpecificationsResult.data[0].priceComponent,
        movieTicketTypeCodes: movieTicketTypeCodes,
        movieTicketTypes: reserve_api_abstract_client_1.mvtk.util.constants.TICKET_TYPE,
        videoFormatType: chevre.factory.videoFormatType
    });
}));
exports.default = priceSpecificationsRouter;
