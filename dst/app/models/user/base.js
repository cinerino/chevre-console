"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ベースユーザークラス
 */
class BaseUser {
    /**
     * サインイン中かどうか
     */
    isAuthenticated() {
        return (this.get('_id') !== null);
    }
    // tslint:disable-next-line:no-reserved-keywords
    get(key) {
        return (this[key] !== undefined) ? this[key] : null;
    }
}
exports.default = BaseUser;
