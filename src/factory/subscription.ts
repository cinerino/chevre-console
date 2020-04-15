/**
 * サブスクリプションインターフェース
 */
export interface ISubscription {
    identifier: string;
    settings: {
        allowNoCapacity: boolean;
        maximumAttendeeCapacity: number;
        allowMultipleEventTimeTables: boolean;
        useSeats: boolean;
        useCategoryCodes: boolean;
        useProducts: boolean;
        usePriceSpecifications: boolean;
        useAccountTitles: boolean;
    };
}
