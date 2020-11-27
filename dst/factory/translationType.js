"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationTypes = exports.TranslationTypeCode = void 0;
var TranslationTypeCode;
(function (TranslationTypeCode) {
    TranslationTypeCode["Subtitle"] = "0";
    TranslationTypeCode["Dubbing"] = "1";
})(TranslationTypeCode = exports.TranslationTypeCode || (exports.TranslationTypeCode = {}));
const types = [
    { codeValue: TranslationTypeCode.Subtitle, name: { ja: '字幕', en: 'subtitle' } },
    { codeValue: TranslationTypeCode.Dubbing, name: { ja: '吹替', en: 'dubbing' } }
];
/**
 * 翻訳タイプ
 */
exports.translationTypes = types;
