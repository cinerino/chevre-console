"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 興行区分ルーター
 */
const express_1 = require("express");
const ServiceTypeController = require("../controllers/serviceType");
const serviceTypesRouter = express_1.Router();
serviceTypesRouter.all('/add', ServiceTypeController.add);
serviceTypesRouter.all('', ServiceTypeController.index);
serviceTypesRouter.all('/getlist', ServiceTypeController.getList);
serviceTypesRouter.all('/:id/update', ServiceTypeController.update);
exports.default = serviceTypesRouter;
