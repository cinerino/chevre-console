"use strict";
/**
 * 券種マスタ管理ルーター
 *
 * @desc TicketTypeRouter
 * @ignore
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketTypeController = require("../../controllers/master/ticketType");
const ticketTypeMasterRouter = express_1.Router();
// 券種登録
ticketTypeMasterRouter.all('/add', ticketTypeController.add);
// 券種編集
ticketTypeMasterRouter.all('/:id/update', ticketTypeController.update);
// 券種一覧
ticketTypeMasterRouter.get('', ticketTypeController.index);
ticketTypeMasterRouter.get('/getlist', ticketTypeController.getList);
exports.default = ticketTypeMasterRouter;
