"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
/**
 * マスタ管理者ユーザー
 */
class MasterAdminUser extends base_1.default {
    static PARSE(session) {
        const user = new MasterAdminUser();
        // セッション値からオブジェクトにセット
        if (session !== undefined && session.hasOwnProperty(MasterAdminUser.AUTH_SESSION_NAME)) {
            Object.keys(session[MasterAdminUser.AUTH_SESSION_NAME]).forEach((propertyName) => {
                user[propertyName] = session[MasterAdminUser.AUTH_SESSION_NAME][propertyName];
            });
        }
        return user;
    }
}
MasterAdminUser.AUTH_SESSION_NAME = 'CHEVREFrontendMasterAuth';
exports.default = MasterAdminUser;
