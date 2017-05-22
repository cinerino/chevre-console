"use strict";
/**
 * 作品マスタ管理ルーター
 *
 * @desc FilmRouter
 * @ignore
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const filmController = require("../../controllers/master/film");
const filmMasterRouter = express_1.Router();
filmMasterRouter.all('/add', filmController.add);
filmMasterRouter.all('', filmController.index);
filmMasterRouter.all('/getlist', filmController.getList);
filmMasterRouter.all('/:filmId/update', filmController.update);
exports.default = filmMasterRouter;
