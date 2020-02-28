"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * サービスルーター
 */
const express = require("express");
const membershipService_1 = require("./services/membershipService");
const servicesRouter = express.Router();
servicesRouter.use('/membershipService', membershipService_1.default);
exports.default = servicesRouter;
