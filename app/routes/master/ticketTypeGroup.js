"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 券種グループマスタ管理ルーター
 *
 * @desc TicketTypeGroupsRouter
 * @ignore
 */
const express_1 = require("express");
const ticketTypeGroupsController = require("../../controllers/master/ticketTypeGroup");
const ticketTypeGroupMasterRouter = express_1.Router();
ticketTypeGroupMasterRouter.all('/add', ticketTypeGroupsController.add);
ticketTypeGroupMasterRouter.all('/:id/update', ticketTypeGroupsController.update);
ticketTypeGroupMasterRouter.get('', ticketTypeGroupsController.index);
ticketTypeGroupMasterRouter.get('/getlist', ticketTypeGroupsController.getList);
exports.default = ticketTypeGroupMasterRouter;
