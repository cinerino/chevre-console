"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * システム共通メッセージ定義
 */
var Common;
(function (Common) {
    const field = '$fieldName$';
    const maxLen = '$maxLength$';
    // メッセージ
    Common.required = '$fieldName$が未入力です';
    Common.maxLength = '$fieldName$は$maxLength$文字以内で入力してください';
    Common.maxLengthHalfByte = '$fieldName$は半角$maxLength$文字以内で入力してください';
    function getMaxLength(fieldName, max) {
        return Common.maxLength.replace(field, fieldName)
            .replace(maxLen, max.toString());
    }
    Common.getMaxLength = getMaxLength;
    function getMaxLengthHalfByte(fieldName, max) {
        return Common.maxLengthHalfByte.replace(field, fieldName)
            .replace(maxLen, max.toString());
    }
    Common.getMaxLengthHalfByte = getMaxLengthHalfByte;
})(Common = exports.Common || (exports.Common = {}));
