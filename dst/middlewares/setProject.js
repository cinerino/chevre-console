"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * リクエストプロジェクト設定ルーター
 */
const cinerino = require("@cinerino/sdk");
const express = require("express");
// tslint:disable-next-line:no-require-imports no-var-requires
const subscriptions = require('../../subscriptions.json');
const setProject = express.Router();
setProject.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // セッションにプロジェクトIDがあればリクエストプロジェクトに設定
    if (typeof ((_a = req.session.project) === null || _a === void 0 ? void 0 : _a.id) === 'string') {
        req.project = req.session.project;
        let subscriptionIdentifier = req.session.subscriptionIdentifier;
        if (typeof subscriptionIdentifier !== 'string') {
            subscriptionIdentifier = 'Free';
        }
        const subscription = subscriptions.find((s) => s.identifier === subscriptionIdentifier);
        req.subscription = subscription;
    }
    else {
        res.redirect('/');
        return;
    }
    next();
}));
// プロジェクト指定ルーティング配下については、すべてreq.projectを上書き
setProject.use('/projects/:id', (req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.project = { typeOf: cinerino.factory.chevre.organizationType.Project, id: req.params.id };
    next();
}));
exports.default = setProject;
