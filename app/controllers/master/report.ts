/**
 * レポート出力コントローラー
 *
 * @namespace controller/film
 */
import { Models } from '@motionpicture/chevre-domain';
//import * as createDebug from 'debug';
import { Request, Response } from 'express';
//import * as jconv from 'jconv';
import * as moment from 'moment';
import * as _ from 'underscore';

// tslint:disable-next-line:no-var-requires no-require-imports
const jconv = require('jconv');
//import * as Message from '../../../common/Const/Message';
//const debug = createDebug('chevre-backend:controller:film');

// カラム区切り(タブ)
const csvSeparator: string = '\t';
// 改行コード(CR+LF)
const csvLineFeed: string = '\r\n';
// 売り上げレポートヘッダ
const arrayHeadSales = [
    '"購入番号"',
    '"パフォーマンスID"',
    '"座席コード"',
    '"予約ステータス"',
    '"上映日"',
    '"開演時刻"',
    '"劇場名称"',
    '"スクリーンID"',
    '"スクリーン名"',
    '"作品ID"',
    '"作品名称"',
    '"購入者区分"',
    '"購入者（名）"',
    '"購入者（姓）"',
    '"購入者メール"',
    '"購入者電話"',
    '"購入者年齢"',
    '"購入者住所"',
    '"購入者性別"',
    '"購入日時"',
    '"決済方法"',
    '"座席グレード名称"',
    '"座席グレード追加料金"',
    '"券種名称"',
    '"券種料金"',
    '"鑑賞者"',
    '"鑑賞者更新日時"',
    '"payment_seat_index"',
    '"予約単位料金"',
    '"窓口ユーザーID"',
    '"入場フラグ"',
    '"入場日時"'
];

/**
 *
 * 売り上げレポート出力
 */
export async function index(__: Request, res: Response): Promise<void> {
    res.render('master/report/index', {
        filmModel: {},
        layout: 'layouts/master/layout'
    });
}
/**
 * 一覧データ取得API
 */
export async function getSales(req: Request, res: Response): Promise<void> {
    // Responseヘッダセット
    const filename = '売り上げレポート';
    res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
    res.setHeader('Content-Type', 'text/csv; charset=Shift_JIS');

    // 登録日
    const createDateFrom: string = (!_.isEmpty(req.query.dateFrom)) ? req.query.dateFrom : null;
    const createDateTo: string = (!_.isEmpty(req.query.dateTo)) ? req.query.dateTo : null;

    // 検索条件を作成
    const conditions: any = {};
    if (createDateFrom !== null || createDateTo !== null) {
        const conditionsDate: any = {};
        const key: string = 'created_at';
        // 登録日From
        if (createDateFrom !== null) {
            const keyFrom = '$gte';
            conditionsDate[keyFrom] = toISOStringJapan(createDateFrom);
        }
        // 登録日To
        if (createDateTo !== null) {
            const keyFrom = '$lt';
            conditionsDate[keyFrom] = toISOStringJapan(createDateTo, 1);
        }
        conditions[key] = conditionsDate;
    }
    try {
        const dataCount = await Models.Reservation.count(conditions).exec();
        let results: any[] = [];
        if (dataCount > 0) {
            const reservations = await Models.Reservation.find(conditions).exec();
            //検索結果編集
            results = reservations.map((reservation) => {
                return getCsvData(reservation._id) +
                    getCsvData(reservation.get('performance')) +
                    getCsvData(reservation.get('seat_code')) +
                    getCsvData(reservation.get('status')) +
                    getCsvData(toYMD(reservation.get('performance_day'))) +
                    getCsvData(toHM(reservation.get('performance_start_time'))) +
                    getCsvData(reservation.get('theater_name').ja) +
                    getCsvData(reservation.get('screen')) +
                    getCsvData(reservation.get('screen_name').ja) +
                    getCsvData(reservation.get('film')) +
                    getCsvData(reservation.get('film_name').ja) +
                    getCsvData(reservation.get('purchaser_group')) +
                    getCsvData(reservation.get('purchaser_first_name')) +
                    getCsvData(reservation.get('purchaser_last_name')) +
                    getCsvData(reservation.get('purchaser_email')) +
                    getCsvData(reservation.get('purchaser_tel')) +
                    getCsvData(reservation.get('purchaser_age')) +
                    getCsvData(reservation.get('purchaser_address')) +
                    getCsvData(reservation.get('purchaser_gender')) +
                    getCsvData(toString(reservation.get('purchased_at'))) +
                    getCsvData(reservation.get('payment_method')) +
                    getCsvData(reservation.get('seat_grade_name').ja) +
                    getCsvData(reservation.get('seat_grade_additional_charge')) +
                    getCsvData(reservation.get('ticket_type_name').ja) +
                    getCsvData(reservation.get('ticket_type_charge')) +
                    getCsvData(reservation.get('watcher_name')) +
                    getCsvData(toString(reservation.get('watcher_name_updated_at'))) +
                    getCsvData(reservation.get('payment_seat_index')) +
                    getCsvData(reservation.get('gmo_amount')) +
                    getCsvData(reservation.get('window_user_id')) +
                    getCsvData('入場フラグ') + //checkins? TRUE,FALSE
                    getCsvData('入場日時', false); //checkins[0]?.when 2016/10/28 17:50:40
            });
        }
        const head = arrayHeadSales.join(csvSeparator) + csvLineFeed;
        res.write(jconv.convert(head, 'UTF8', 'SJIS'));
        res.write(jconv.convert(results.join(csvLineFeed), 'UTF8', 'SJIS'));
        res.end();
    } catch (error) {
        const message: string = error.message;
        res.write(message);
        res.end();
    }
}
/**
 * CSV出力用データ取得
 *
 * @param {any} value
 * @param {boolean} addSeparator
 * @returns {string}
 */
function getCsvData(value: string, addSeparator: boolean = true): string {
    return `"${((!_.isEmpty(value)) ? value : '' + '"')}${(addSeparator ? csvSeparator : '')}`;
}
/**
 * YYYY/MM/DD日付取得
 *
 * @param {string} dateStr('YYYYMMDD')
 * @returns {string} ('YYYY/MM/DD')
 */
function toYMD(dateStr: string): string {
    return moment(dateStr, 'YYYYMMDD').format('YYYY/MM/DD');
}
/**
 * HH:MM時刻取得
 *
 * @param {string} timeStr('HHMM')
 * @returns {string} ('HH:MM')
 */
function toHM(timeStr: string): string {
    // tslint:disable-next-line:no-magic-numbers
    return `${timeStr.substr(0, 2)}:${timeStr.substr(2, 2)}`;
}
/**
 * YYYY/MM/DD HH:mm:ss 日時取得
 *
 * @param {Date} date
 * @returns {string} ('YYYY/MM/DD HH:mm:ss')
 */
function toString(date: Date): string {
    return (date instanceof Date) ? moment(date).format('YYYY/MM/DD HH:mm:ss') : '';
}
/**
 * DB検索用ISO日付取得
 *
 * @param {string} dateStr
 * @param {number} addDay
 * @returns {string}
 */
function toISOStringJapan(dateStr: string, addDay: number = 0): string {
    const dateWk: string = moment(dateStr, 'YYYY/MM/DD').add(addDay, 'days').format('YYYYMMDD');

    // tslint:disable-next-line:no-magic-numbers
    return `${dateWk.substr(0, 4)}-${dateWk.substr(4, 2)}-${dateWk.substr(6, 2)}T00:00:00+09:00`;
}
