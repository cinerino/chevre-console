/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
import { mvtk } from '@movieticket/reserve-api-abstract-client'
import { Router } from 'express';

const priceSpecificationsRouter = Router();
priceSpecificationsRouter.get(
    '',
    async (req, res) => {
        const priceSpecificationService = new chevre.service.PriceSpecification({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchVideoFormatCompoundPriceSpecificationsResult = await priceSpecificationService.searchCompoundPriceSpecifications({
            limit: 1,
            page: 1,
            typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: { typeOf: chevre.factory.priceSpecificationType.VideoFormatChargeSpecification }
        });
        const searchSoundFormatCompoundPriceSpecificationsResult = await priceSpecificationService.searchCompoundPriceSpecifications({
            limit: 1,
            page: 1,
            typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: { typeOf: chevre.factory.priceSpecificationType.SoundFormatChargeSpecification }
        });
        const searchMovieTicketTypeChargeCompoundPriceSpecificationsResult =
            await priceSpecificationService.searchCompoundPriceSpecifications({
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
            movieTicketTypes: mvtk.util.constants.TICKET_TYPE,
            videoFormatType: chevre.factory.videoFormatType
        });
    }
);
export default priceSpecificationsRouter;
