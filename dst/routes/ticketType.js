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
 * 券種マスタ管理ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const ticketTypeController = require("../controllers/ticketType");
const ticketTypeCategories = [
    { id: chevre.factory.ticketTypeCategory.Default, name: '有料券' },
    { id: chevre.factory.ticketTypeCategory.Advance, name: '前売券' },
    { id: chevre.factory.ticketTypeCategory.Free, name: '無料券' }
];
const ticketTypeMasterRouter = express_1.Router();
// 券種登録
ticketTypeMasterRouter.all('/add', ticketTypeController.add);
// 券種編集
ticketTypeMasterRouter.all('/:id/update', ticketTypeController.update);
// 券種一覧
ticketTypeMasterRouter.get('', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const offerService = new chevre.service.Offer({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const ticketTypeGroupsList = yield offerService.searchTicketTypeGroups({});
    // 券種マスタ画面遷移
    res.render('ticketType/index', {
        message: '',
        ticketTypeGroupsList: ticketTypeGroupsList.data,
        ticketTypeCategories: ticketTypeCategories
    });
}));
ticketTypeMasterRouter.get('/getlist', ticketTypeController.getList);
ticketTypeMasterRouter.get('/getTicketTypeGroupList/:ticketTypeId', ticketTypeController.getTicketTypeGroupList);
exports.default = ticketTypeMasterRouter;
