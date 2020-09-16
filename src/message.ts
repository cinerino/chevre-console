/**
 * システム共通メッセージ定義
 */
export namespace Common {
    const field: string = '$fieldName$';
    const maxLen: string = '$maxLength$';

    // メッセージ
    export const required = '$fieldName$が未入力です';
    export const maxLength = '$fieldName$は$maxLength$文字以内で入力してください';
    export const maxLengthHalfByte = '$fieldName$は半角$maxLength$文字以内で入力してください';

    export function getMaxLength(fieldName: string, max: number): string {
        return maxLength.replace(field, fieldName)
            .replace(maxLen, max.toString());
    }

    export function getMaxLengthHalfByte(fieldName: string, max: number): string {
        return maxLengthHalfByte.replace(field, fieldName)
            .replace(maxLen, max.toString());
    }
}
