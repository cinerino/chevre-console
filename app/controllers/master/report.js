"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * レポート出力コントローラー
 *
 * @namespace controller/film
 */
const chevre_domain_1 = require("@motionpicture/chevre-domain");
//import * as jconv from 'jconv';
const moment = require("moment");
const _ = require("underscore");
// tslint:disable-next-line:no-var-requires no-require-imports
const jconv = require('jconv');
//import * as Message from '../../../common/Const/Message';
//const debug = createDebug('chevre-backend:controller:film');
// カラム区切り(タブ)
const csvSeparator = '\t';
// 改行コード(CR+LF)
const csvLineFeed = '\r\n';
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
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.render('master/report/index', {
            displayId: 'Aa-9',
            title: '売り上げレポート出力',
            filmModel: {},
            layout: 'layouts/master/layout'
        });
    });
}
exports.index = index;
/**
 * 一覧データ取得API
 */
function getSales(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Responseヘッダセット
        const filename = '売り上げレポート';
        res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
        res.setHeader('Content-Type', 'text/csv; charset=Shift_JIS');
        // 登録日
        const createDateFrom = (!_.isEmpty(req.query.dateFrom)) ? req.query.dateFrom : null;
        const createDateTo = (!_.isEmpty(req.query.dateTo)) ? req.query.dateTo : null;
        // 検索条件を作成
        const conditions = {};
        if (createDateFrom !== null || createDateTo !== null) {
            const conditionsDate = {};
            const key = 'created_at';
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
            const dataCount = yield chevre_domain_1.Models.Reservation.count(conditions).exec();
            let results = [];
            if (dataCount > 0) {
                const reservations = yield chevre_domain_1.Models.Reservation.find(conditions).exec();
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
                        getCsvData('入場フラグ') +
                        getCsvData('入場日時', false); //checkins[0]?.when 2016/10/28 17:50:40
                });
            }
            const head = arrayHeadSales.join(csvSeparator) + csvLineFeed;
            res.write(jconv.convert(head, 'UTF8', 'SJIS'));
            res.write(jconv.convert(results.join(csvLineFeed), 'UTF8', 'SJIS'));
            res.end();
        }
        catch (error) {
            const message = error.message;
            res.write(message);
            res.end();
        }
    });
}
exports.getSales = getSales;
/**
 * CSV出力用データ取得
 *
 * @param {any} value
 * @param {boolean} addSeparator
 * @returns {string}
 */
function getCsvData(value, addSeparator = true) {
    return `"${((!_.isEmpty(value)) ? value : '' + '"')}${(addSeparator ? csvSeparator : '')}`;
}
/**
 * YYYY/MM/DD日付取得
 *
 * @param {string} dateStr('YYYYMMDD')
 * @returns {string} ('YYYY/MM/DD')
 */
function toYMD(dateStr) {
    return moment(dateStr, 'YYYYMMDD').format('YYYY/MM/DD');
}
/**
 * HH:MM時刻取得
 *
 * @param {string} timeStr('HHMM')
 * @returns {string} ('HH:MM')
 */
function toHM(timeStr) {
    // tslint:disable-next-line:no-magic-numbers
    return `${timeStr.substr(0, 2)}:${timeStr.substr(2, 2)}`;
}
/**
 * YYYY/MM/DD HH:mm:ss 日時取得
 *
 * @param {Date} date
 * @returns {string} ('YYYY/MM/DD HH:mm:ss')
 */
function toString(date) {
    return (date instanceof Date) ? moment(date).format('YYYY/MM/DD HH:mm:ss') : '';
}
/**
 * DB検索用ISO日付取得
 *
 * @param {string} dateStr
 * @param {number} addDay
 * @returns {string}
 */
function toISOStringJapan(dateStr, addDay = 0) {
    const dateWk = moment(dateStr, 'YYYY/MM/DD').add(addDay, 'days').format('YYYYMMDD');
    // tslint:disable-next-line:no-magic-numbers
    return `${dateWk.substr(0, 4)}-${dateWk.substr(4, 2)}-${dateWk.substr(6, 2)}T00:00:00+09:00`;
}
