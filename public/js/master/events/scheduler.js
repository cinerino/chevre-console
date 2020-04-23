/**
 * 一時間の高さ
 */
var HOUR_HEIGHT = 40;
/**
 * スクリーン行幅
 */
var SCREEN_WIDTH = 60;
/**
 * 時間列幅
 */
var TIME_WIDTH = 50;
/**
 * タイムゾーン
 */
var TIME_ZONE = 'Asia/Tokyo';

/**
 * スケジューラー生成
 */
function createScheduler() {
    return new Vue({
        el: '#scheduler',
        data: {
            editingPerforamce: undefined,
            moment: moment,
            searchCondition: {},
            scheduleData: { dates: [] },
            times: []
        },
        methods: {
            /**
             * 座席指定判定
             */
            isReservedSeatsAvailable: function (performance) {
                return !(performance.offers
                    && performance.offers.itemOffered.serviceOutput !== undefined
                    && performance.offers.itemOffered.serviceOutput.reservedTicket !== undefined
                    && performance.offers.itemOffered.serviceOutput.reservedTicket.ticketedSeat === undefined);
            },
            /**
             * ムビチケ対応判定
             */
            isSupportMovieTicket: function (performance) {
                return (performance.offers !== undefined
                    && Array.isArray(performance.offers.acceptedPaymentMethod)
                    && performance.offers.acceptedPaymentMethod.indexOf('MovieTicket') < 0);
            },
            /**
             * 追加特性取得performance.superEvent.additionalProperty
             */
            getAdditionalProperty: function (additionalPropertys, name) {
                if (additionalPropertys === undefined) {
                    return null;
                }
                var findResult = additionalPropertys.find(function (additionalProperty) {
                    return (additionalProperty.name === name);
                });
                if (findResult === undefined) {
                    return null;
                }
                return findResult.value;
            },
            /**
             * スケジューラー生成
             */
            create: function () {
                this.createTimes();
                this.searchCondition = this.getSearchCondition();
                if (this.searchCondition.theater === ''
                    || this.searchCondition.date === '') {
                    alert('劇場、上映日を選択してください');
                    return;
                }
                var _this = this;

                this.searchScreeningEvent()
                    .then(function (data) {
                        modalInit(_this.getSearchCondition().theater, _this.getSearchCondition().date, data.ticketGroups);
                        _this.createScheduleData(data);
                    })
                    .catch(function (error) {
                        alert('検索できませんでした');
                    });
            },
            /**
             * 検索条件取得
             */
            getSearchCondition: function () {
                return {
                    theater: $('.search select[name=theater]').val(),
                    date: $('.search input[name=date]').val(),
                    format: $('.search select[name=format]').val(),
                    screen: ($('.search select[name=screen]').val() === '') ? undefined : $('.search select[name=screen]').val(),
                    onlyReservedSeatsAvailable: $('.search input[name=onlyReservedSeatsAvailable]:checked').val(),
                    offersAvailable: $('.search input[name="offersAvailable"]:checked').val(),
                    offersValid: $('.search input[name="offersValid"]:checked').val(),
                    onlyEventScheduled: $('.search input[name="onlyEventScheduled"]:checked').val(),
                    'superEvent[workPerformed][identifier]': $('.search select[name="superEvent\\[workPerformed\\]\\[identifier\\]"]').val()
                };
            },
            /**
             * スケジュール情報検索API
             */
            searchScreeningEvent: function () {
                var options = {
                    dataType: 'json',
                    url: SEARCH_URL,
                    type: 'GET',
                    data: this.searchCondition,
                    beforeSend: function () {
                        $('#loadingModal').modal({ backdrop: 'static' });
                    }
                };
                return $.ajax(options).always(function () {
                    $('#loadingModal').modal('hide');
                });
            },
            /**
             * スケジュールデータ作成
             */
            createScheduleData: function (data) {
                this.scheduleData.dates = [];
                var limit = Number(this.searchCondition.format);
                for (var i = 0; i < limit; i++) {
                    var date = moment(this.searchCondition.date, 'YYYY/MM/DD').add(i, 'days').toISOString();
                    this.scheduleData.dates.push({
                        data: date,
                        screens: data.screens.map(function (s) {
                            return {
                                data: s,
                                performances: data.performances.filter(function (p) {
                                    var expectedDate = Number(moment(date).tz(TIME_ZONE).format('YYYYMMDD'));
                                    var startDate = Number(moment(p.startDate).tz(TIME_ZONE).format('YYYYMMDD'));
                                    var endDate = Number(moment(p.endDate).tz(TIME_ZONE).format('YYYYMMDD'));
                                    var isDateMatched = startDate <= expectedDate && endDate >= expectedDate;
                                    var isLocationMatched = p.location.branchCode === s.branchCode;
                                    // 同一スクリーンかつ同一日時に上映しているか
                                    return isLocationMatched && isDateMatched;
                                })
                            };
                        })
                    });
                }
            },
            /**
             * 時間データ生成
             */
            createTimes: function () {
                this.times = [];
                for (var i = 0; i < 24; i++) {
                    this.times.push(`0${i}`.slice(-2) + ':00');
                }
            },
            /**
             * パフォーマンスの表示位置取得
             */
            getPerformanceStyle: function (performance, date) {
                var currentDate = moment(date.data).tz(TIME_ZONE);
                var viewDate = {
                    day: Number(currentDate.format('YYYYMMDD')),
                    hour: Number(currentDate.format('HH')),
                    minutes: Number(currentDate.format('mm'))
                }
                var doorTime = moment(performance.doorTime).tz(TIME_ZONE);
                var start = {
                    day: Number(doorTime.format('YYYYMMDD')),
                    hour: Number(doorTime.format('HH')),
                    minutes: Number(doorTime.format('mm'))
                };
                var endDate = moment(performance.endDate).tz(TIME_ZONE);
                var end = {
                    day: Number(endDate.format('YYYYMMDD')),
                    hour: Number(endDate.format('HH')),
                    minutes: Number(endDate.format('mm'))
                };

                var hour = 60;
                var top = (start.hour * HOUR_HEIGHT) + (start.minutes * HOUR_HEIGHT / hour);
                var left = 0;
                var borderRadius = '6px';
                var height = ((end.hour - start.hour) * HOUR_HEIGHT) + ((end.minutes - start.minutes) * HOUR_HEIGHT / hour);
                var isMultiple = end.day > start.day;
                // 複数日（初日表示）
                if (isMultiple && start.day === viewDate.day) {
                    height = ((24 - start.hour) * HOUR_HEIGHT) + ((0 - start.minutes) * HOUR_HEIGHT / hour);
                    borderRadius = '6px 6px 0px 0px';
                }
                // 複数日（中日表示）
                if (isMultiple && start.day !== viewDate.day && end.day !== viewDate.day) {
                    top = 0;
                    height = 24 * HOUR_HEIGHT;
                    borderRadius = '0px';
                }
                // 複数日（最終日表示）
                if (isMultiple && end.day === viewDate.day) {
                    top = 0;
                    height = ((end.hour - 0) * HOUR_HEIGHT) + ((end.minutes - 0) * HOUR_HEIGHT / hour);
                    borderRadius = '0px 0px 6px 6px';
                }

                var opacity = 1;
                if (performance.eventStatus === 'EventCancelled') {
                    opacity = 0.5;
                }

                return {
                    parent: {
                        top: top + 'px',
                        left: left + 'px',
                        height: height + 'px',
                        '-moz-opacity': opacity,
                        opacity: opacity
                    },
                    child: {
                        backgroundColor: this.getAdditionalProperty(performance.superEvent.additionalProperty, 'color'),
                        borderRadius: borderRadius
                    }
                };
            },
            /**
             * 時間重複数取得
             */
            getOverlapPerformanceCount: function (targetPerformance, performances) {
                var doorTime = moment(targetPerformance.doorTime).unix();
                var endDate = moment(targetPerformance.endDate).unix();
                var filterResult = performances.filter(function (p) {
                    return ((moment(p.doorTime).unix() < doorTime && moment(p.endDate).unix() > doorTime)
                        || (moment(p.doorTime).unix() < endDate && moment(p.endDate).unix() > endDate));
                });
                return filterResult.length;
            },
            /**
             * パフォーマンス表示
             */
            showPerformance: function (performance) {
                var _this = this;

                var modal = $('#showModal');

                modal.find('a.edit')
                    .off('click')
                    .on('click', function () {
                        _this.editPerformance(performance);
                    });

                modal.find('a.reserve')
                    .off('click')
                    .on('click', function () {
                        var url = '/transactions/reserve/start?event=' + performance.id;
                        window.open(url, '_blank');
                    });

                var seller = {};
                if (performance.offers.seller !== undefined) {
                    seller = performance.offers.seller;
                }
                if (seller.name === undefined) {
                    seller.name = {};
                }

                var seatsAvailable = (this.isReservedSeatsAvailable(performance)) ? '有' : '無';
                var remainingAttendeeCapacity = '';
                var maximumAttendeeCapacity = '';
                if (typeof performance.remainingAttendeeCapacity === 'number') {
                    remainingAttendeeCapacity = String(performance.remainingAttendeeCapacity);
                }
                if (typeof performance.maximumAttendeeCapacity === 'number') {
                    maximumAttendeeCapacity = String(performance.maximumAttendeeCapacity);
                }

                var details = $('<dl>').addClass('row')
                    .append($('<dt>').addClass('col-md-3').append('ID'))
                    .append($('<dd>').addClass('col-md-9').append(performance.id))
                    .append($('<dt>').addClass('col-md-3').append('ステータス'))
                    .append($('<dd>').addClass('col-md-9').append(performance.eventStatus))
                    .append($('<dt>').addClass('col-md-3').append('名称'))
                    .append($('<dd>').addClass('col-md-9').append(performance.name.ja))
                    .append($('<dt>').addClass('col-md-3').append('期間'))
                    .append($('<dd>').addClass('col-md-9').append(
                        moment(performance.startDate).tz(TIME_ZONE).format('YYYY-MM-DD HH:mm')
                        + ' - '
                        + moment(performance.endDate).tz(TIME_ZONE).format('YYYY-MM-DD HH:mm')
                    ))
                    .append($('<dt>').addClass('col-md-3').append('場所'))
                    .append($('<dd>').addClass('col-md-9').append(performance.superEvent.location.name.ja + ' ' + performance.location.name.ja))
                    .append($('<dt>').addClass('col-md-3').append('キャパシティ'))
                    .append($('<dd>').addClass('col-md-9').append(remainingAttendeeCapacity + ' / ' + maximumAttendeeCapacity))
                    .append($('<dt>').addClass('col-md-3').append('販売者'))
                    .append($('<dd>').addClass('col-md-9').append(seller.id + ' ' + seller.name.ja))
                    .append($('<dt>').addClass('col-md-3').append('カタログ'))
                    .append($('<dd>').addClass('col-md-9').append($('<a>').attr({
                        target: '_blank',
                        'href': '/offerCatalogs/' + performance.offers.id + '/update'
                    }).text(performance.offers.name.ja)))
                    .append($('<dt>').addClass('col-md-3').append('座席'))
                    .append($('<dd>').addClass('col-md-9').append(seatsAvailable))
                    .append($('<dt>').addClass('col-md-3').append('表示期間'))
                    .append($('<dd>').addClass('col-md-9').append(
                        moment(performance.offers.availabilityStarts).tz(TIME_ZONE).format('YYYY-MM-DD HH:mm')
                        + ' - '
                        + moment(performance.offers.availabilityEnds).tz(TIME_ZONE).format('YYYY-MM-DD HH:mm')
                    ))
                    .append($('<dt>').addClass('col-md-3').append('販売期間'))
                    .append($('<dd>').addClass('col-md-9').append(
                        moment(performance.offers.validFrom).tz(TIME_ZONE).format('YYYY-MM-DD HH:mm')
                        + ' - '
                        + moment(performance.offers.validThrough).tz(TIME_ZONE).format('YYYY-MM-DD HH:mm')
                    ))
                    ;

                var div = $('<div>')
                    .append(details);

                // modal.find('.modal-title').text('イベントオファー');
                modal.find('.modal-body').html(div);

                modal.modal();
            },
            /**
             * パフォーマンス編集
             */
            editPerformance: function (performance) {
                this.editingPerforamce = performance;
                console.log('editing...', this.editingPerforamce);

                var fix = function (time) { return ('0' + (parseInt(time / 5) * 5)).slice(-2); };
                var day = moment(performance.startDate).tz(TIME_ZONE).format('YYYYMMDD');

                var modal = $('#editModal');
                modal.find('.day span').text(moment(day).format('YYYY年MM月DD日(ddd)'));
                modal.find('.day input').val(moment(day).format('YYYY年MM月DD日(ddd)'));

                // チェックstartTime削除ボタン表示
                if (moment(day).isSameOrAfter(moment().tz(TIME_ZONE), 'day')) {
                    modal.find('.delete-button').show();
                } else {
                    modal.find('.delete-button').hide();
                }

                // ボタン有効性
                modal.find('.update-button').prop('disabled', false);
                modal.find('.delete-button').prop('disabled', false);
                if (performance.eventStatus === 'EventCancelled') {
                    modal.find('.update-button').prop('disabled', true);
                    modal.find('.delete-button').prop('disabled', true);
                }

                modal.find('input[name=performance]').val(performance.id);
                modal.find('input[name=theater]').val(performance.superEvent.location.id);
                modal.find('input[name=screen]').val(performance.location.branchCode);
                modal.find('input[name=day]').val(day);
                modal.find('input[name=screeningEventId]').val(performance.superEvent.id);
                modal.find('input[name=mvtkExcludeFlg]').prop('checked', this.isSupportMovieTicket(performance));
                modal.find('input[name=reservedSeatsAvailableDisabled]').prop('checked', this.isReservedSeatsAvailable(performance));
                modal.find('input[name=reservedSeatsAvailable]').val((this.isReservedSeatsAvailable(performance)) ? '1' : '0');
                modal.find('input[name=maxSeatNumber]').val((performance.offers !== undefined) ? performance.offers.eligibleQuantity.maxValue : '');
                modal.find('input[name=maximumAttendeeCapacity]').val(performance.location.maximumAttendeeCapacity);
                modal.find('.film span').text(performance.name.ja);
                modal.find('.film input').val(performance.name.ja);
                modal.find('.theater input').val(performance.superEvent.location.name.ja);
                modal.find('.screen input').val(performance.location.name.ja);

                // 上映時間
                var doorTime = moment(performance.doorTime).tz(TIME_ZONE).format('HH:mm');
                var startTime = moment(performance.startDate).tz(TIME_ZONE).format('HH:mm');
                var endDay = moment(performance.endDate).tz(TIME_ZONE).format('YYYY/MM/DD');
                var endTime = moment(performance.endDate).tz(TIME_ZONE).format('HH:mm');
                modal.find('input[name=doorTime]').val(doorTime);
                modal.find('input[name=startTime]').val(startTime);
                modal.find('input[name=endTime]').val(endTime);
                modal.find('input[name=endDay]').datepicker('update', endDay);
                modal.find('select[name=ticketTypeGroup]').val(performance.offers.id);

                var seller = performance.offers.seller;
                if (seller !== undefined && seller !== null) {
                    modal.find('select[name=seller]').val(seller.id);
                } else {
                    var theaterName = performance.superEvent.location.name.ja;

                    // 販売者に同名称の選択肢があれば自動選択
                    modal.find('select[name=seller] option').each(function () {
                        if ($(this).text() === theaterName) {
                            console.log('matched!');
                            $(this).prop('selected', true);
                        }
                    });

                    // modal.find('select[name=seller]').prop('selectedIndex', 0);
                }

                // 販売開始日時
                var saleStartDate = (performance.offers === undefined)
                    ? '' : moment(performance.offers.validFrom).tz(TIME_ZONE).format('YYYY/MM/DD');
                var saleStartTime = (performance.offers === undefined)
                    ? '' : moment(performance.offers.validFrom).tz(TIME_ZONE).format('HH:mm');
                if (saleStartDate !== '' && saleStartTime !== '') {
                    modal.find('input[name=saleStartDate]').datepicker('update', saleStartDate);
                    modal.find('input[name=saleStartTime]').val(saleStartTime);
                } else {
                    modal.find('input[name=saleStartDate]').val('');
                    modal.find('input[name=saleStartTime]').val('');
                }
                // オンライン表示
                var onlineDisplayStartDate = (performance.offers)
                    ? moment(performance.offers.availabilityStarts).tz(TIME_ZONE).format('YYYY/MM/DD') : '';
                var onlineDisplayStartTime = (performance.offers)
                    ? moment(performance.offers.availabilityStarts).tz(TIME_ZONE).format('HH:mm') : '';
                if (onlineDisplayStartDate !== '') {
                    modal.find('input[name=onlineDisplayStartDate]').datepicker('update', onlineDisplayStartDate);
                    modal.find('input[name=onlineDisplayStartTime]').val(onlineDisplayStartTime);
                } else {
                    modal.find('input[name=onlineDisplayStartDate]').val('');
                    modal.find('input[name=onlineDisplayStartTime]').val('');
                }

                // 追加特性(フォームを初期化してからイベントの値をセット)
                for (let i = 0; i < 10; i++) {
                    modal.find('input[name="additionalProperty[' + i + '][name]"]').val('');
                    modal.find('input[name="additionalProperty[' + i + '][value]"]').val('');
                }
                var additionalProperty = (Array.isArray(performance.additionalProperty)) ? performance.additionalProperty : [];
                additionalProperty.forEach(function (property, index) {
                    modal.find('input[name="additionalProperty[' + index + '][name]"]').val(property.name);
                    modal.find('input[name="additionalProperty[' + index + '][value]"]').val(property.value);
                });

                modal.modal();
            }
        }
    });
}