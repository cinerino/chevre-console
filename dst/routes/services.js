"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * サービスルーター
 */
const express = require("express");
const membershipProgram_1 = require("./services/membershipProgram");
const servicesRouter = express.Router();
servicesRouter.use('/membershipProgram', membershipProgram_1.default);
exports.default = servicesRouter;
