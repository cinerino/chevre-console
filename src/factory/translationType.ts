import { factory } from '@cinerino/sdk';

export enum TranslationTypeCode {
    Subtitle = '0',
    Dubbing = '1'
}

export interface ITranslationType {
    codeValue: TranslationTypeCode;
    name: factory.multilingualString;
}

const types: ITranslationType[] = [
    { codeValue: TranslationTypeCode.Subtitle, name: { ja: '字幕', en: 'subtitle' } },
    { codeValue: TranslationTypeCode.Dubbing, name: { ja: '吹替', en: 'dubbing' } }
];

/**
 * 翻訳タイプ
 */
export const translationTypes = types;
