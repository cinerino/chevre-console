/**
 * スケジュール作成中かどうか
 */
var creatingSchedules = false;

var scheduler;
var ITEMS_ON_PAGE;
var conditions = {};
var SEARCH_URL;

var locationSelection;

$(function () {
    SEARCH_URL = '/projects/' + PROJECT_ID + '/events/screeningEvent/search';
    locationSelection = $('#screen');
    ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    // 開催日
    $('.search form input[name=date], #newModal input[name="screeningDateStart"], #newModal input[name="screeningDateThrough"]')
        .val(moment().tz('Asia/Tokyo').format('YYYY/MM/DD'));

    // timepickerセット
    if ($('.timepicker').length > 0) {
        $('.timepicker').timepicker({
            step: 5,
            timeFormat: 'H:i',
            // interval: 60,
            // minTime: '10',
            // maxTime: '6:00pm',
            // defaultTime: '11',
            // startTime: '10:00',
            // dynamic: false,
            // dropdown: true,
            // scrollbar: true
        })
    }

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    });

    // 共通一覧表示初期セット・ページャセット
    $.CommonMasterList.init('#templateRow', '#searchedCount');
    $.CommonMasterList.pager('#pager', ITEMS_ON_PAGE, function (pageNumber) {
        search(pageNumber);
    });

    //スケジューラー初期化
    scheduler = createScheduler();

    searchSchedule();

    // 検索
    $(document).on('click', '.search-button', searchSchedule);
    // 新規作成
    $(document).on('click', '.add-button', add);

    // 新規登録（確定）
    $(document).on('click', '.regist-button', regist);

    // 更新（確定）
    $(document).on('click', '.update-button', update);

    // 削除ボタンの処理
    $(document).on('click', '.delete-button', deletePerformance);

    // 絶対・相対切り替え
    $(document).on('change', 'input[name=onlineDisplayType], input[name=saleStartDateType], input[name=saleEndDateType]', changeInputType)

    // 施設検索条件変更イベント
    $(document).on('change', '.search select[name="theater"]', _.debounce(function () {
        initializeLocationSelection();
    }, 500));

    $(document).on('change', '#newModal select[name="superEvent"]', function () {
        var mvtkFlg = $(this).find('option:selected').attr('data-mvtk-flag');
        if (mvtkFlg != 1) {
            $('#newModal input[name=mvtkExcludeFlg]').removeAttr('checked');
            $('#newModal .mvtk').hide();
        } else {
            $('#newModal .mvtk').show();
        }
    });

    // 作成モーダルの施設選択イベント
    $(document).on('change', '#newModal select[name="theater"]', _.debounce(function () {
        var theater = $(this).val();
        var sellerId = $(this).find('option:selected').attr('data-seller');

        // 販売者を検索して、選択肢にセットする
        getSeller(sellerId);

        initializeScreenSelection(theater);
        initializeSuperEventSelection(theater);
    }, 500));

    $(document).on('change', '.search input[name="date"]', _.debounce(function () {
        // var theater = $('.search select[name=theater]').val();
        // var date = $(this).val();
    }, 500));

    var target = [
        'input[name="doorTime"]',
        'input[name="startTime"]',
        'input[name="endTime"]',
        'select[name="hasOfferCatalog"]',
        'select[name="ticketTypeGroup"]'
    ];
    $(document).on(
        'change',
        target.join(', '),
        function () {
            $(this).parents('.timeTable').attr('data-dirty', true);
        }
    );

    // COAイベントインポート
    $(document).on('click', 'a.importFromCOA', function (event) {
        var theater = $('.search select[name=theater]').val();
        if (!theater) {
            alert('施設を選択してください');

            return;
        }

        var message = '施設:' + theater + 'のCOAイベントをインポートしようとしています。'
            + '\nよろしいですか？';

        if (window.confirm(message)) {
            $.ajax({
                url: '/projects/' + PROJECT_ID + '/events/screeningEvent/importFromCOA',
                type: 'POST',
                dataType: 'json',
                data: $('.search form').serialize()
            }).done(function (tasks) {
                console.log(tasks);
                alert('インポートを開始しました');
            }).fail(function (xhr) {
                var res = $.parseJSON(xhr.responseText);
                alert(res.error.message);
            }).always(function () {
            });
        } else {
        }
    });

    $(document).on('click', '.showOffers', function (event) {
        var id = $(this).attr('data-id');

        showOffersById(id);
    });

    $(document).on('click', '.showAdditionalProperty', function (event) {
        var id = $(this).attr('data-id');

        showAdditionalProperty(id);
    });

    $(document).on('click', '.showPerformance', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing event...id:', id);

        showPerformance(id);
    });

    $('.search select[name="theater"]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/places/movieTheater/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    name: params.term
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (movieTheater) {
                        return {
                            id: movieTheater.id,
                            text: movieTheater.name.ja
                        }
                    })
                };
            }
        }
    });

    locationSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/places/screeningRoom/search',
            dataType: 'json',
            data: function (params) {
                var movieTheaterId = $('.search select[name="theater"]').val();
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    containedInPlace: {
                        id: { $eq: movieTheaterId }
                    }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (place) {
                        return {
                            id: place.branchCode,
                            text: place.name.ja
                        }
                    })
                };
            }
        }
    });

    var movieSelection = $('#superEvent\\[workPerformed\\]\\[identifier\\]');
    movieSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/creativeWorks/movie/getlist',
            dataType: 'json',
            data: function (params) {
                var query = {
                    name: params.term
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (movie) {
                        return {
                            id: movie.identifier,
                            text: movie.name
                        }
                    })
                };
            }
        }
    });

    $('#hasOfferCatalog\\[id\\]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/offerCatalogs/getlist',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: params.term,
                    // itemOffered: { typeOf: { $eq: '' } }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (offerCatalog) {
                        return {
                            id: offerCatalog.id,
                            text: offerCatalog.name.ja
                        }
                    })
                };
            }
        }
    });

    $('select[name=endDayRelative]').select2({
        placeholder: 'n日後',
        tags: true,
        createTag: function (params) {
            var term = $.trim(params.term);

            if (term === '') {
                return null;
            }

            if (isNaN(term)) {
                return null;
            }

            var relativeDay = Number(term);

            return {
                id: relativeDay,
                text: relativeDay + '日後',
                newTag: true // add additional parameters
            }
        }
    });

    $('select[name="hasOfferCatalog"]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: 'カタログ選択',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/offerCatalogs/getlist',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: params.term,
                    itemOffered: {
                        typeOf: { $eq: 'EventService' }
                    }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (offerCatalog) {
                        return {
                            id: offerCatalog.id,
                            text: offerCatalog.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#newModal select[name="theater"]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        templateSelection: function (data, container) {
            // Add custom attributes to the <option> tag for the selected option
            $(data.element).attr({
                'data-max-seat-number': data['data-max-seat-number'],
                'data-sale-start-days': data['data-sale-start-days'],
                'data-end-sale-time': data['data-end-sale-time'],
                'data-name': data['data-name'],
                'data-seller': data['data-seller'],
            });

            return data.text;
        },
        ajax: {
            url: '/projects/' + PROJECT_ID + '/places/movieTheater/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    name: params.term
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (movieTheater) {
                        return {
                            id: movieTheater.id,
                            text: movieTheater.name.ja,
                            'data-max-seat-number': movieTheater.offers.eligibleQuantity.maxValue,
                            'data-sale-start-days': -Number(movieTheater.offers.availabilityStartsGraceTime.value),
                            'data-end-sale-time': Math.floor(movieTheater.offers.availabilityEndsGraceTime.value / 60),
                            'data-name': movieTheater.name.ja,
                            'data-seller': movieTheater.parentOrganization.id
                        }
                    })
                };
            }
        }
    });

});

function getSeller(sellerId) {
    if (!sellerId) {
        return;
    }

    var sellerSelection = $('#newModal select[name="seller"]');
    sellerSelection.html('<option selected disabled>検索中...</option>')
    $.ajax({
        dataType: 'json',
        url: '/projects/' + PROJECT_ID + '/sellers/' + sellerId,
        type: 'GET',
        data: {}
    }).done(function (seller) {
        console.log('seller found', seller);
        var options = ['<option selected="selected" value="' + seller.id + '">' + seller.name.ja + '</option>'];
        sellerSelection.html(options);
    }).fail(function (jqxhr, textStatus, error) {
        alert('販売者を検索できませんでした。施設を再選択してください。');
    });
}

function initializeLocationSelection() {
    locationSelection.val(null)
        .trigger('change');
}

function initializeSuperEventSelection(theater) {
    if (!theater) {
        return;
    }

    var superEventSelection = $('#superEvent');
    superEventSelection.val(null).trigger('change');
    superEventSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        templateSelection: function (data, container) {
            // Add custom attributes to the <option> tag for the selected option
            $(data.element).attr({
                'data-mvtk-flag': data['data-mvtk-flag'],
                'data-startDate': data['data-startDate'],
                'data-endDate': data['data-endDate'],
            });

            return data.text;
        },
        ajax: {
            url: '/projects/' + PROJECT_ID + '/events/screeningEventSeries/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    locationId: theater,
                    name: params.term
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (eventSeries) {
                        return {
                            id: eventSeries.id,
                            text: eventSeries.filmNameJa,
                            'data-mvtk-flag': eventSeries.mvtkFlg,
                            'data-startDate': eventSeries.startDate,
                            'data-endDate': eventSeries.endDate
                        }
                    })
                };
            }
        }
    });
}

function initializeScreenSelection(theater) {
    if (!theater) {
        return;
    }

    var screenSelection = $('#newModal select[name="screen"]');
    screenSelection.val(null).trigger('change');
    screenSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/places/screeningRoom/search',
            // url: '/places/movieTheater/' + theater + '/screeningRooms',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    containedInPlace: { id: { $eq: theater } },
                    name: { $regex: params.term },
                    $projection: {
                        sectionCount: 1,
                        seatCount: 1
                    }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (screeningRoom) {
                        var text = screeningRoom.name.ja;
                        if (typeof screeningRoom.seatCount === 'number') {
                            text += ' (' + screeningRoom.seatCount + '席)'
                        }
                        return {
                            id: screeningRoom.branchCode,
                            text: text
                        }
                    })
                };
            }
        }
    });
}

function getWeekDayData() {
    var weekDayData = $('#newModal input[name="weekDay"]:checked');
    if (weekDayData.length === 0) {
        return [];
    }
    var result = [];
    weekDayData.each(function () {
        result.push($(this).val());
    });
    return result;
}

/**
 * 登録スケジュールのタイムテーブルを取得する
 */
function getTableData() {
    var tempData = [];
    var timeTableData = $('#newModal .timeTable[data-dirty="true"]');
    var repeatableTimeTable = $('#newModal .repeatableTimeTable');

    const staicTimeTablePanel = $('.staicTimeTablePanel').hasClass('active');
    const repeatableTimeTablePanel = $('.repeatableTimeTablePanel').hasClass('active');

    if (staicTimeTablePanel) {
        timeTableData.each(function (_, row) {
            const mvtkExcludeFlg = $(row).find('input[name="mvtkExcludeFlg"]:checked').val() === undefined ? 0 : 1;
            var o = {
                doorTime: $(row).find('input[name="doorTime"]').val(),
                startTime: $(row).find('input[name="startTime"]').val(),
                endTime: $(row).find('input[name="endTime"]').val(),
                endDayRelative: Number($(row).find('select[name="endDayRelative"]').val()),
                ticketTypeGroup: $(row).find('select[name="hasOfferCatalog"]').val(),
                // ticketTypeGroup: $(row).find('select[name="ticketTypeGroup"]').val(),
                mvtkExcludeFlg: mvtkExcludeFlg
            };

            var isValidRow = true;

            // 入力していない情報があればNG
            if (
                typeof o.doorTime !== 'string' || o.doorTime.length === 0 ||
                typeof o.startTime !== 'string' || o.startTime.length === 0 ||
                typeof o.endTime !== 'string' || o.endTime.length === 0 ||
                typeof o.endDayRelative !== 'number' || String(o.endDayRelative).length === 0 ||
                typeof o.ticketTypeGroup !== 'string' || o.ticketTypeGroup.length === 0
            ) {
                isValidRow = false;
            }

            if (isValidRow) {
                console.log('adding timeTable...', o);
                tempData.push(o);
            }
        });
    }

    if (repeatableTimeTablePanel) {
        repeatableTimeTable.each(function (_, row) {
            var repeatEveryMinutes = $(row).find('input[name="repeatEveryMinutes"]').val();
            var repeatFrom = $(row).find('input[name="repeatFrom"]').val();
            var repeatThrough = $(row).find('input[name="repeatThrough"]').val();
            var ticketTypeGroup = $(row).find('select[name="hasOfferCatalog"]').val();
            // var ticketTypeGroup = $(row).find('select[name="ticketTypeGroup"]').val();

            var isValidRow = true;

            // 入力していない情報があればNG
            if (
                typeof repeatEveryMinutes !== 'string' || repeatEveryMinutes.length === 0 ||
                typeof repeatFrom !== 'string' || repeatFrom.length === 0 ||
                typeof repeatThrough !== 'string' || repeatThrough.length === 0 ||
                typeof ticketTypeGroup !== 'string' || ticketTypeGroup.length === 0
            ) {
                isValidRow = false;
            }

            if (isValidRow) {
                var endDate = moment('2020-05-16T' + repeatFrom + ':00+09:00');
                var startThrough = moment('2020-05-16T' + repeatThrough + ':00+09:00');
                while (endDate <= startThrough) {
                    endDate.add(Number(repeatEveryMinutes), 'minutes');

                    tempData.push({
                        doorTime: moment(endDate).add(-Number(repeatEveryMinutes), 'minutes').tz('Asia/Tokyo').format('HH:mm'),
                        startTime: moment(endDate).add(-Number(repeatEveryMinutes), 'minutes').tz('Asia/Tokyo').format('HH:mm'),
                        endTime: moment(endDate).tz('Asia/Tokyo').format('HH:mm'),
                        endDayRelative: 0,
                        ticketTypeGroup: ticketTypeGroup,
                        mvtkExcludeFlg: 0
                    });


                }
                // console.log('adding timeTable...', o);
                // tempData.push(o);
            }
        });
    }

    // タイムテーブルなしはNG
    if (tempData.length === 0) {
        return {
            ticketData: [],
            timeData: [],
            mvtkExcludeFlgData: []
        };
    }

    if (staicTimeTablePanel && tempData.length !== timeTableData.length) {
        alert('情報が足りないタイムテーブルがあります。スケジュール登録モーダルを一度閉じてください。');

        return {
            ticketData: [],
            timeData: [],
            mvtkExcludeFlgData: []
        };
    }

    var timeData = tempData.map(function (data) {
        return {
            doorTime: data.doorTime.replace(':', ''),
            startTime: data.startTime.replace(':', ''),
            endTime: data.endTime.replace(':', ''),
            endDayRelative: Number(data.endDayRelative)
        }
    });
    var ticketData = tempData.map(function (data) {
        return data.ticketTypeGroup
    });
    var mvtkExcludeFlgData = tempData.map(function (data) {
        return data.mvtkExcludeFlg
    });

    return {
        ticketData: ticketData,
        timeData: timeData,
        mvtkExcludeFlgData: mvtkExcludeFlgData
    };
}

/**
 * 新規登録（確定）
 * @returns {void}
 */
function regist() {
    // 作成中なら何もしない
    if (creatingSchedules) {
        return;
    }
    creatingSchedules = true;

    var modal = $('#newModal');
    var theater = modal.find('select[name=theater]').val();
    var screen = modal.find('select[name=screen]').val();
    var maximumAttendeeCapacity = modal.find('input[name=maximumAttendeeCapacity]').val();
    var startDate = modal.find('input[name=screeningDateStart]').val();
    var toDate = modal.find('input[name=screeningDateThrough]').val();
    var screeningEventId = modal.find('select[name=superEvent]').val();
    var seller = modal.find('select[name=seller]').val();

    // 販売開始日時
    var saleStartDateType = modal.find('input[name=saleStartDateType]:checked').val();
    var saleStartDate = (saleStartDateType === 'absolute')
        ? modal.find('input[name=saleStartDateAbsolute]').val()
        : (saleStartDateType === 'relative')
            ? modal.find('input[name=saleStartDateRelative]').val()
            : 'default';
    var saleStartTime = (saleStartDateType === 'absolute')
        ? modal.find('input[name=saleStartTime]').val().replace(':', '')
        : 'default';

    // 販売終了日時
    var saleEndDateType = modal.find('input[name=saleEndDateType]:checked').val();
    var saleEndDate = (saleEndDateType === 'absolute')
        ? modal.find('input[name=saleEndDateAbsolute]').val()
        : (saleEndDateType === 'relative')
            ? modal.find('input[name=saleEndDateRelative]').val()
            : 'default';
    var saleEndTime = (saleEndDateType === 'absolute')
        ? modal.find('input[name=saleEndTime]').val().replace(':', '')
        : 'default';

    var onlineDisplayType = modal.find('input[name=onlineDisplayType]:checked').val();
    var onlineDisplayStartDate = (onlineDisplayType === 'absolute')
        ? modal.find('input[name=onlineDisplayStartDateAbsolute]').val()
        : modal.find('input[name=onlineDisplayStartDateRelative]').val();
    var onlineDisplayStartTime = (onlineDisplayType === 'absolute')
        ? modal.find('input[name=onlineDisplayStartTime]').val().replace(':', '')
        : 'default';

    var tableData = getTableData();
    console.log('tableData:', tableData);

    var weekDayData = getWeekDayData();
    var reservedSeatsAvailable = modal.find('input[name=reservedSeatsAvailable]:checked').val();

    if (typeof seller !== 'string' || seller.length === 0) {
        creatingSchedules = false;
        alert('販売者を選択してください');
        return;
    }

    if (typeof theater !== 'string' || theater.length === 0
        || typeof screen !== 'string' || screen.length === 0
        || typeof startDate !== 'string' || startDate.length === 0
        || typeof toDate !== 'string' || toDate.length === 0
        || typeof screeningEventId !== 'string' || screeningEventId.length === 0
        || typeof saleStartDate !== 'string' || saleStartDate.length === 0
        || typeof saleStartTime !== 'string' || saleStartTime.length === 0
        || typeof saleEndDate !== 'string' || saleEndDate.length === 0
        || typeof saleEndTime !== 'string' || saleEndTime.length === 0
        || typeof onlineDisplayStartDate !== 'string' || onlineDisplayStartDate.length === 0
        || typeof onlineDisplayStartTime !== 'string' || onlineDisplayStartTime.length === 0
    ) {
        creatingSchedules = false;
        alert('未入力の項目があります');
        return;
    }

    if (weekDayData.length === 0) {
        creatingSchedules = false;
        alert('曜日を入力してください');
        return;
    }

    if (tableData.ticketData.length === 0
        || tableData.timeData.length === 0) {
        creatingSchedules = false;
        alert('時刻、カタログを入力してください');
        return;
    }

    // 時刻の現実性チェック
    var isTimesValid = true;
    tableData.timeData.forEach(function (data) {
        if (data.doorTime > data.startTime || (data.endDayRelative === 0 && data.startTime > data.endTime)) {
            isTimesValid = false;
        }
    });
    if (!isTimesValid) {
        creatingSchedules = false;
        alert('開場/開始/終了時刻を確認してください');
        return;
    }

    var selectedTheater = modal.find('select[name=theater] option:selected');
    var maxSeatNumber = selectedTheater.attr('data-max-seat-number');
    var saleStartDays = selectedTheater.attr('data-sale-start-days');
    var endSaleTimeAfterScreening = selectedTheater.attr('data-end-sale-time');

    if (moment(startDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ') >= moment(toDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day')) {
        creatingSchedules = false;
        alert('登録期間を正しく設定してください');
        return;
    }

    // 登録期間が興行期間に含まれているかどうか確認
    var eventSeriesStartDate = modal.find('select[name=superEvent]').find('option:selected').attr('data-startDate');
    var eventSeriesEndDate = modal.find('select[name=superEvent]').find('option:selected').attr('data-endDate');
    if (moment(startDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ') < moment(eventSeriesStartDate)
        || moment(toDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day') > moment(eventSeriesEndDate)) {
        creatingSchedules = false;
        alert('登録期間を興行期間内に設定してください');
        return;
    }

    if (
        maxSeatNumber === undefined
        || saleStartDays === undefined
        || endSaleTimeAfterScreening === undefined
    ) {
        creatingSchedules = false;
        alert('エラーが発生しました/nページをレフレッシュしてください！');
        return;
    }

    var originalButtonText = $('.regist-button').text();
    $.ajax({
        dataType: 'json',
        url: '/projects/' + PROJECT_ID + '/events/screeningEvent/regist',
        type: 'POST',
        data: {
            theater: theater,
            screen: screen,
            maximumAttendeeCapacity: maximumAttendeeCapacity,
            screeningEventId: screeningEventId,
            startDate: startDate,
            toDate: toDate,
            weekDayData: weekDayData,
            timeData: tableData.timeData,
            ticketData: tableData.ticketData,
            mvtkExcludeFlgData: tableData.mvtkExcludeFlgData,
            seller: seller,
            saleStartDateType: saleStartDateType,
            saleStartDate: saleStartDate,
            saleStartTime: saleStartTime,
            saleEndDateType: saleEndDateType,
            saleEndDate: saleEndDate,
            saleEndTime: saleEndTime,
            onlineDisplayType: onlineDisplayType,
            onlineDisplayStartDate: onlineDisplayStartDate,
            onlineDisplayStartTime: onlineDisplayStartTime,
            maxSeatNumber: maxSeatNumber,
            saleStartDays: saleStartDays,
            endSaleTimeAfterScreening: endSaleTimeAfterScreening,
            reservedSeatsAvailable: reservedSeatsAvailable
        },
        beforeSend: function () {
            $('.regist-button').prop('disabled', true);
            $('.regist-button').text('登録中...');
        }
    }).done(function (data) {
        modal.modal('hide');
        if ($('.search select[name=theater]').val() !== theater) {
            $('.search select[name=theater]').val(theater);
            initializeLocationSelection();
        }
        searchSchedule();

        return;
    }).fail(function (jqxhr, textStatus, error) {
        var message = '';
        console.error(jqxhr, textStatus, error);
        if (jqxhr.responseJSON != undefined && jqxhr.responseJSON != null) {
            message = jqxhr.responseJSON.message;
        }

        alert('登録に失敗しました:' + message);
    }).always(function () {
        creatingSchedules = false;
        $('.regist-button').prop('disabled', false);
        $('.regist-button').text(originalButtonText);
    });
}

/**
 * 更新（確定）
 * @function update
 * @returns {void}
 */
function update() {
    var modal = $('#editModal');
    var theater = modal.find('input[name=theater]').val();
    var screen = modal.find('input[name=screen]').val();
    var day = modal.find('input[name=day]').val();
    var endDay = modal.find('input[name=endDay]').val();
    var screeningEventId = modal.find('input[name=screeningEventId]').val();
    var performance = modal.find('input[name=performance]').val();
    var maximumAttendeeCapacity = modal.find('input[name=maximumAttendeeCapacity]').val();
    var doorTime = modal.find('input[name=doorTime]').val().replace(':', '');
    var startTime = modal.find('input[name=startTime]').val().replace(':', '');
    var endTime = modal.find('input[name=endTime]').val().replace(':', '');
    var ticketTypeGroup = modal.find('select[name="hasOfferCatalog"]').val();
    var seller = modal.find('select[name=seller]').val();
    var saleStartDate = modal.find('input[name=saleStartDate]').val();
    var saleStartTime = modal.find('input[name=saleStartTime]').val().replace(':', '');
    var saleEndDate = modal.find('input[name=saleEndDate]').val();
    var saleEndTime = modal.find('input[name=saleEndTime]').val().replace(':', '');
    var onlineDisplayStartDate = modal.find('input[name=onlineDisplayStartDate]').val();
    var onlineDisplayStartTime = modal.find('input[name=onlineDisplayStartTime]').val().replace(':', '');
    var maxSeatNumber = modal.find('input[name=maxSeatNumber]').val();
    var mvtkExcludeFlg = modal.find('input[name=mvtkExcludeFlg]:checked').val();
    var reservedSeatsAvailable = modal.find('input[name=reservedSeatsAvailable]').val();

    // 追加特性を収集
    var additionalProperty = [];
    for (let i = 0; i < 10; i++) {
        var additionalPropertyName = modal.find('input[name="additionalProperty[' + i + '][name]"]').val();
        var additionalPropertyValue = modal.find('input[name="additionalProperty[' + i + '][value]"]').val();
        additionalProperty.push({ name: String(additionalPropertyName), value: String(additionalPropertyValue) });
    }

    if (performance === ''
        || screen === ''
        || doorTime === ''
        || startTime === ''
        || endTime === ''
        || endDay === ''
        || typeof ticketTypeGroup !== 'string' || ticketTypeGroup === ''
        || saleStartDate === ''
        || saleStartTime === ''
        || saleEndDate === ''
        || saleEndTime === ''
        || onlineDisplayStartDate === ''
        || onlineDisplayStartTime === ''
    ) {
        alert('情報が足りません');
        return;
    }

    // オンライン表示開始日 ≦ 当日を確認
    var performanceBefore = scheduler.editingPerforamce;
    console.log('checking online display start date...', performanceBefore.offers.availabilityStarts);
    var onlineDisplayStartDateBefore = moment(performanceBefore.offers.availabilityStarts);
    var onlineDisplayStartDateAfter = moment(onlineDisplayStartDate + 'T' + onlineDisplayStartTime + ':00+09:00', 'YYYY/MM/DDTHHmm:ssZ');
    var now = moment();
    var confirmed = false;
    if (onlineDisplayStartDateBefore <= now && onlineDisplayStartDateAfter > now) {
        if (window.confirm('オンライン表示中のスケジュールが非表示になります。本当に変更しますか？')) {
            confirmed = true;
        }
    } else {
        confirmed = true;
    }

    if (confirmed) {
        $.ajax({
            dataType: 'json',
            url: '/projects/' + PROJECT_ID + '/events/screeningEvent/' + performance + '/update',
            type: 'POST',
            data: {
                theater: theater,
                screen: screen,
                maximumAttendeeCapacity: maximumAttendeeCapacity,
                day: day,
                endDay: endDay,
                screeningEventId: screeningEventId,
                doorTime: doorTime,
                startTime: startTime,
                endTime: endTime,
                ticketTypeGroup: ticketTypeGroup,
                seller: seller,
                saleStartDate: saleStartDate,
                saleStartTime: saleStartTime,
                saleEndDate: saleEndDate,
                saleEndTime: saleEndTime,
                onlineDisplayStartDate: onlineDisplayStartDate,
                onlineDisplayStartTime: onlineDisplayStartTime,
                maxSeatNumber: maxSeatNumber,
                mvtkExcludeFlg: mvtkExcludeFlg,
                reservedSeatsAvailable: reservedSeatsAvailable,
                additionalProperty: additionalProperty
            }
        }).done(function (data) {
            modal.modal('hide');
            searchSchedule();
            return;
        }).fail(function (jqxhr, textStatus, error) {
            var error = jqxhr.responseJSON;
            var message = '';
            if (error !== undefined && error !== null) {
                message = error.message;
            }
            console.error(jqxhr.responseJSON);
            alert('更新できませんでした:' + message);
        });
    }
}

/**
 * 検索
 */
function searchSchedule() {
    var format = $('.search select[name=format]').val();

    switch (format) {
        case 'table':
            $('#scheduler').addClass('d-none');

            search(1);

            break;

        default:
            $('#list').hide();
            $('#datatables_info,#datatables_paginate,#pager').empty();
            $('#scheduler').removeClass('d-none');

            scheduler.create();
            break;
    }
}

//--------------------------------
// 検索API呼び出し
//--------------------------------
function search(pageNumber) {
    // 検索条件取得
    conditions = $.fn.getDataFromForm('.search form');
    conditions['limit'] = ITEMS_ON_PAGE;
    conditions['page'] = pageNumber;

    $.ajax({
        dataType: 'json',
        url: SEARCH_URL,
        cache: false,
        type: 'GET',
        data: conditions,
        beforeSend: function () {
            $('#loadingModal').modal({ backdrop: 'static' });
        }
    }).done(function (data) {
        if (data.success) {
            var dataCount = (data.count) ? (data.count) : 0;
            // 一覧表示
            if ($.CommonMasterList.bind(data.results, dataCount, pageNumber)) {
                $('#list').show();
            } else {
                $('#list').hide();
            }
        }
    }).fail(function (jqxhr, textStatus, error) {
        alert('検索できませんでした');
    }).always(function (data) {
        $('#loadingModal').modal('hide');
    });
}

/**
 * 削除の処理
 * @function deletePerformance
 * @returns {void}
 */
function deletePerformance() {
    var modal = $('#editModal');
    var performance = modal.find('input[name=performance]').val();
    if (performance === '') {
        alert('情報が足りません');
        return;
    }
    $.ajax({
        dataType: 'json',
        url: '/projects/' + PROJECT_ID + '/events/screeningEvent/' + performance + '/cancel',
        type: 'PUT',
    }).done(function (data) {
        if (!data.error) {
            modal.modal('hide');
            searchSchedule();
            return;
        }
        alert('削除に失敗しました');
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('削除に失敗しました');
    });
}

/**
 * モーダル初期化
 */
function modalInit(theater, date) {
    var newModal = $('#newModal');
    // newModal.find('.theater span').text($('.search select[name=theater] option[value=' + theater + ']').text());
    // newModal.find('.day span').text(moment(date, 'YYYY/MM/DD').format('YYYY年MM月DD日(ddd)'));
    // newModal.find('input[name=theater]').val(theater);
    // newModal.find('input[name=day]').val(date);
}

/**
 * 新規作成
 * @function add
 * @returns {void}
 */
function add() {
    var modal = $('#newModal');
    modal.find('select[name=theater]')
        .val(null)
        .trigger('change');
    modal.find('input[name=weekDay]').prop('checked', true);
    modal.find('select[name=superEvent]')
        .html('<option selected disabled>施設を選択してください</option>');
    // try {
    //     modal.find('#superEvent').select2('destory');
    // } catch (error) {
    // }
    modal.find('select[name=screen]')
        .html('<option selected disabled>施設を選択してください</option>');
    modal.find('select[name=seller]')
        .html('<option selected disabled>施設を選択してください</option>');

    modal.find('input[name=maximumAttendeeCapacity]').val('');
    modal.find('input[name=doorTime]').val('');
    modal.find('input[name=startTime]').val('');
    modal.find('input[name=endTime]').val('');
    modal.find('select[name=endDayRelative]').select2('val', '0');
    modal.find('input[name=mvtkExcludeFlg]').removeAttr('checked');
    modal.find('select[name="hasOfferCatalog"]')
        .val(null)
        .trigger('change');
    modal.find('input[name=saleStartDateAbsolute]').datepicker('update', '');
    modal.find('input[name=saleStartTime]').val('');
    modal.find('input[name=onlineDisplayStartDateRelative]').val('');
    modal.find('input[name=onlineDisplayStartDateAbsolute]').datepicker('update', '');
    modal.find('input[name=onlineDisplayStartDate]').datepicker('update', '');
    modal.find('input[name=onlineDisplayStartTime]').val('00:00');
    modal.find('input[name=maxSeatNumber]').val('');

    modal.find('input[name=screeningDateStart]').datepicker('update', new Date());
    modal.find('input[name=screeningDateThrough]').datepicker('update', new Date());

    modal.find('.mvtk').show();

    modal.find('.timeTable').attr('data-dirty', false);

    $('#newModal').modal();
}

/**
 * スケジューラー生成
 */
function createScheduler() {
    return new Vue({
        el: '#scheduler',
        data: {
            editingPerforamce: undefined,
            HOUR_HEIGHT: 40,
            SCREEN_WIDTH: 60,
            TIME_WIDTH: 50,
            moment: moment,
            searchCondition: {},
            scheduleData: {
                dates: []
            },
            times: []
        },
        methods: {
            /**
             * 座席指定判定
             */
            isReservedSeatsAvailable: function (performance) {
                return performance.offers !== undefined
                    && performance.offers.itemOffered !== undefined
                    && performance.offers.itemOffered.serviceOutput !== undefined
                    && performance.offers.itemOffered.serviceOutput.reservedTicket !== undefined
                    && performance.offers.itemOffered.serviceOutput.reservedTicket.ticketedSeat !== undefined;
            },
            /**
             * ムビチケ対応判定
             */
            isSupportMovieTicket: function (performance) {
                // unacceptedPaymentMethodにMovieTicketは含まれていればムビチケ利用不可
                var unaccepted = performance.offers !== undefined
                    && Array.isArray(performance.offers.unacceptedPaymentMethod)
                    && performance.offers.unacceptedPaymentMethod.indexOf('MovieTicket') >= 0;

                return unaccepted;
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
                console.log('this.searchCondition:', this.searchCondition);
                if (this.searchCondition.theater === ''
                    || this.searchCondition.date === '') {
                    alert('施設、開催日を選択してください');
                    return;
                }
                var _this = this;

                this.searchScreeningEvent()
                    .then(function (data) {
                        modalInit(_this.getSearchCondition().theater, _this.getSearchCondition().date);
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
                return $.ajax(options)
                    .always(function () {
                        $('#loadingModal').modal('hide');
                    });
            },
            /**
             * スケジュールデータ作成
             */
            createScheduleData: function (data) {
                this.scheduleData.dates = [];
                for (var i = 0; i < Number(this.searchCondition.format); i++) {
                    var date = moment(this.searchCondition.date, 'YYYY/MM/DD')
                        .add(i, 'days')
                        .toISOString();
                    this.scheduleData.dates.push({
                        data: date,
                        screens: data.screens.map(function (s) {
                            return {
                                data: s,
                                performances: data.performances.filter(function (p) {
                                    var expectedDate = moment(date)
                                        .tz('Asia/Tokyo')
                                        .format('YYYYMMDD');
                                    var isDateMatched = moment(p.startDate).tz('Asia/Tokyo').format('YYYYMMDD') === expectedDate
                                        || moment(p.endDate).tz('Asia/Tokyo').format('YYYYMMDD') === expectedDate;
                                    var isLocationMatched = p.location.branchCode === s.branchCode;

                                    // 同一ルームかつ同一日時に上映しているか
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
                var viewDate = {
                    day: moment(date.data).tz('Asia/Tokyo').format('YYYYMMDD'),
                    hour: moment(date.data).tz('Asia/Tokyo').format('HH'),
                    minutes: moment(date.data).tz('Asia/Tokyo').format('mm')
                }
                var start = {
                    day: moment(performance.doorTime).tz('Asia/Tokyo').format('YYYYMMDD'),
                    hour: moment(performance.doorTime).tz('Asia/Tokyo').format('HH'),
                    minutes: moment(performance.doorTime).tz('Asia/Tokyo').format('mm')
                };
                var end = {
                    day: moment(performance.endDate).tz('Asia/Tokyo').format('YYYYMMDD'),
                    hour: moment(performance.endDate).tz('Asia/Tokyo').format('HH'),
                    minutes: moment(performance.endDate).tz('Asia/Tokyo').format('mm')
                };

                var hour = 60;
                var top = (start.hour * this.HOUR_HEIGHT) + (start.minutes * this.HOUR_HEIGHT / hour);
                var left = 0;
                var borderRadius = '6px';

                var height = ((end.hour - start.hour) * this.HOUR_HEIGHT) + ((end.minutes - start.minutes) * this.HOUR_HEIGHT / hour);
                // 日本時間で日またぎの場合（当日表示）
                if (Number(end.day) > Number(start.day) && Number(start.day) === Number(viewDate.day)) {
                    height = ((24 - start.hour) * this.HOUR_HEIGHT) + ((0 - start.minutes) * this.HOUR_HEIGHT / hour);
                    borderRadius = '6px 6px 0px 0px';
                }
                // 日本時間で日またぎの場合（翌日表示）
                if (Number(end.day) > Number(start.day) && Number(end.day) === Number(viewDate.day)) {
                    top = 0;
                    height = ((end.hour - 0) * this.HOUR_HEIGHT) + ((end.minutes - 0) * this.HOUR_HEIGHT / hour);
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
             * イベントのカタログを取得する
             */
            findCatalogByPerformance: function (performance) {
                var options = {
                    dataType: 'json',
                    url: '/projects/' + PROJECT_ID + '/events/screeningEvent/' + performance.id + '/hasOfferCatalog',
                    type: 'GET',
                    data: {},
                    beforeSend: function () {
                        $('#loadingModal').modal({ backdrop: 'static' });
                    }
                };

                return $.ajax(options)
                    .always(function () {
                        $('#loadingModal').modal('hide');
                    });
            },

            /**
             * イベントの販売者を取得する
             */
            findSellerByPerformance: function (performance) {
                var options = {
                    dataType: 'json',
                    url: '/projects/' + PROJECT_ID + '/sellers/' + performance.offers.seller.id,
                    type: 'GET',
                    data: {},
                    beforeSend: function () {
                        $('#loadingModal').modal({ backdrop: 'static' });
                    }
                };

                return $.ajax(options)
                    .always(function () {
                        $('#loadingModal').modal('hide');
                    });
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
                        // カタログを取得
                        _this.findCatalogByPerformance(performance)
                            .then(function (catalog) {
                                console.log('catalog found.', catalog);
                                _this.findSellerByPerformance(performance)
                                    .then(function (seller) {
                                        console.log('seller found.', seller);

                                        _this.editPerformance(performance, catalog, seller);
                                    })
                                    .catch(function (error) {
                                        alert('販売者を検索できませんでした');
                                    });
                            })
                            .catch(function (error) {
                                alert('カタログを検索できませんでした');
                            });
                    });

                modal.find('a.reserve')
                    .off('click')
                    .on('click', function () {
                        var url = '/projects/' + PROJECT_ID + '/transactions/reserve/start?event=' + performance.id;
                        window.open(url, '_blank');
                    });

                modal.find('a.aggregateReservation')
                    .off('click')
                    .on('click', function () {
                        _this.aggregateReservation(performance);
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
                        moment(performance.startDate).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
                        + ' - '
                        + moment(performance.endDate).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
                    ))
                    .append($('<dt>').addClass('col-md-3').append('場所'))
                    .append($('<dd>').addClass('col-md-9').append(performance.superEvent.location.name.ja + ' ' + performance.location.name.ja))
                    .append($('<dt>').addClass('col-md-3').append('キャパシティ'))
                    .append($('<dd>').addClass('col-md-9').append(remainingAttendeeCapacity + ' / ' + maximumAttendeeCapacity));

                details.append($('<dt>').addClass('col-md-3').append('カタログ'));
                if (performance.hasOfferCatalog !== undefined) {
                    details.append($('<dd>').addClass('col-md-9').append($('<a>').attr({
                        target: '_blank',
                        'href': '/projects/' + PROJECT_ID + '/offerCatalogs/' + performance.hasOfferCatalog.id + '/update'
                    }).html(
                        performance.hasOfferCatalog.id
                        + ' <i class="material-icons" style="font-size: 1.2em;">open_in_new</i>'
                    )));
                } else {
                    details.append($('<dd>').addClass('col-md-9').append($('<span>').text('')));
                }

                details.append($('<dt>').addClass('col-md-3').append('販売者'))
                    .append($('<dd>').addClass('col-md-9').append(
                        $('<a>').attr({
                            target: '_blank',
                            'href': '/projects/' + PROJECT_ID + '/sellers/' + seller.id + '/update'
                        }).html(
                            seller.id
                            + ' <i class="material-icons" style="font-size: 1.2em;">open_in_new</i>'
                        )
                    ))
                    .append($('<dt>').addClass('col-md-3').append('座席'))
                    .append($('<dd>').addClass('col-md-9').append(seatsAvailable))
                    .append($('<dt>').addClass('col-md-3').append('公開期間'))
                    .append($('<dd>').addClass('col-md-9').append(
                        moment(performance.offers.availabilityStarts).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
                        + ' - '
                        + moment(performance.offers.availabilityEnds).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
                    ))
                    .append($('<dt>').addClass('col-md-3').append('販売期間'))
                    .append($('<dd>').addClass('col-md-9').append(
                        moment(performance.offers.validFrom).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
                        + ' - '
                        + moment(performance.offers.validThrough).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
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
            editPerformance: function (performance, offerCatalog, seller) {
                this.editingPerforamce = performance;
                console.log('editing...', this.editingPerforamce);

                var fix = function (time) { return ('0' + (parseInt(time / 5) * 5)).slice(-2); };
                var day = moment(performance.startDate).tz('Asia/Tokyo').format('YYYYMMDD');

                var modal = $('#editModal');
                modal.find('.day span').text(moment(day).format('YYYY/MM/DD'));
                modal.find('.day input').val(moment(day).format('YYYY/MM/DD'));

                // チェックstartTime削除ボタン表示
                if (moment(day).isSameOrAfter(moment().tz('Asia/Tokyo'), 'day')) {
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

                if (performance.offers !== undefined && performance.offers.eligibleQuantity !== undefined) {
                    modal.find('input[name=maxSeatNumber]').val((performance.offers !== undefined) ? performance.offers.eligibleQuantity.maxValue : '');
                }

                modal.find('input[name=maximumAttendeeCapacity]').val(performance.location.maximumAttendeeCapacity);
                modal.find('.film span').text(performance.superEvent.name.ja);
                modal.find('.film input').val(performance.superEvent.name.ja);
                modal.find('.theater input').val(performance.superEvent.location.name.ja);
                modal.find('.screen input').val(performance.location.name.ja);

                // 上映時間
                var doorTime = moment(performance.doorTime).tz('Asia/Tokyo').format('HH:mm');
                var startTime = moment(performance.startDate).tz('Asia/Tokyo').format('HH:mm');
                var endDay = moment(performance.endDate).tz('Asia/Tokyo').format('YYYY/MM/DD');
                var endTime = moment(performance.endDate).tz('Asia/Tokyo').format('HH:mm');
                modal.find('input[name=doorTime]').val(doorTime);
                modal.find('input[name=startTime]').val(startTime);
                modal.find('input[name=endTime]').val(endTime);
                modal.find('input[name=endDay]').datepicker('update', endDay);

                if (performance.hasOfferCatalog !== undefined) {
                    // カタログの初期値を設定する
                    var hasOfferCatalogNewOption = new Option(offerCatalog.name.ja, offerCatalog.id, true, true);
                    modal.find('select[name="hasOfferCatalog"]')
                        .append(hasOfferCatalogNewOption)
                        .trigger('change');
                }

                if (seller !== undefined && seller !== null) {
                    // 販売者をセット
                    var options = ['<option selected="selected" value="' + seller.id + '">' + seller.name.ja + '</option>'];
                    modal.find('select[name=seller]').html(options);
                }

                // 販売開始日時
                var saleStartDate = (performance.offers === undefined)
                    ? '' : moment(performance.offers.validFrom).tz('Asia/Tokyo').format('YYYY/MM/DD');
                var saleStartTime = (performance.offers === undefined)
                    ? '' : moment(performance.offers.validFrom).tz('Asia/Tokyo').format('HH:mm');
                if (saleStartDate !== '' && saleStartTime !== '') {
                    modal.find('input[name=saleStartDate]').datepicker('update', saleStartDate);
                    modal.find('input[name=saleStartTime]').val(saleStartTime);
                } else {
                    modal.find('input[name=saleStartDate]').val('');
                    modal.find('input[name=saleStartTime]').val('');
                }

                // 販売終了日時
                var saleEndDate = (performance.offers === undefined)
                    ? '' : moment(performance.offers.validThrough).tz('Asia/Tokyo').format('YYYY/MM/DD');
                var saleEndTime = (performance.offers === undefined)
                    ? '' : moment(performance.offers.validThrough).tz('Asia/Tokyo').format('HH:mm');
                if (saleEndDate !== '' && saleEndTime !== '') {
                    modal.find('input[name=saleEndDate]').datepicker('update', saleEndDate);
                    modal.find('input[name=saleEndTime]').val(saleEndTime);
                } else {
                    modal.find('input[name=saleEndDate]').val('');
                    modal.find('input[name=saleEndTime]').val('');
                }

                // オンライン表示
                var onlineDisplayStartDate = (performance.offers)
                    ? moment(performance.offers.availabilityStarts).tz('Asia/Tokyo').format('YYYY/MM/DD') : '';
                var onlineDisplayStartTime = (performance.offers)
                    ? moment(performance.offers.availabilityStarts).tz('Asia/Tokyo').format('HH:mm') : '';
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
            },

            aggregateReservation: function (event) {
                console.log('aggregating...', event.id);

                $.ajax({
                    dataType: 'json',
                    url: '/projects/' + PROJECT_ID + '/events/screeningEvent/' + event.id + '/aggregateReservation',
                    type: 'POST',
                }).done(function (data) {
                    alert('集計を開始しました');
                }).fail(function (jqxhr, textStatus, error) {
                    console.error(jqxhr, textStatus, error);
                    alert('集計を開始できませんでした');
                });
            }
        }
    });
}

/**
 * 入力方法切り替え(絶対・相対)
 */
function changeInputType() {
    var inputType = $(this).val();
    var parent = $(this).parents('.form-group');
    parent.find('.input-type').addClass('d-none');
    parent.find('.input-type[data-input-type=' + inputType + ']').removeClass('d-none');
}

function showOffersById(id) {
    var event = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (event === undefined) {
        alert('イベント' + id + 'が見つかりません');

        return;
    }

    if (event.hasOfferCatalog !== undefined && typeof event.hasOfferCatalog.id === 'string' && event.hasOfferCatalog.id.length > 0) {
        $.ajax({
            dataType: 'json',
            url: '/projects/' + PROJECT_ID + '/events/screeningEvent/' + id + '/offers',
            cache: false,
            type: 'GET',
            data: {},
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            showOffers(event, data);
        }).fail(function (jqxhr, textStatus, error) {
            alert('検索できませんでした');
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    } else {
        showOffers(event, []);
    }
}

function showOffers(event, offers) {
    var modal = $('#modal-event');

    var thead = $('<thead>').addClass('text-primary')
        .append([
            $('<tr>').append([
                $('<th>').text('コード'),
                $('<th>').text('名称')
            ])
        ]);
    var tbody = $('<tbody>')
        .append(offers.map(function (result) {
            var url = '/projects/' + PROJECT_ID + '/offers/' + result.id + '/update';

            return $('<tr>').append([
                $('<td>').html('<a target="_blank" href="' + url + '">' + result.identifier + ' <i class="material-icons" style="font-size: 1.2em;">open_in_new</i></a>'),
                $('<td>').text(result.name.ja)
            ]);
        }))
    var table = $('<table>').addClass('table table-sm')
        .append([thead, tbody]);

    var seller;
    if (event.offers.seller !== undefined && event.offers.seller !== null) {
        seller = $('<dl>').addClass('row')
            .append($('<dt>').addClass('col-md-3').append('販売者'))
            .append($('<dd>').addClass('col-md-9').append(event.offers.seller.id));
    }

    var availability = $('<dl>').addClass('row')
        .append($('<dt>').addClass('col-md-3').append('公開期間'))
        .append($('<dd>').addClass('col-md-9').append(
            moment(event.offers.availabilityStarts).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
            + ' - '
            + moment(event.offers.availabilityEnds).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
        ));

    var validity = $('<dl>').addClass('row')
        .append($('<dt>').addClass('col-md-3').append('販売期間'))
        .append($('<dd>').addClass('col-md-9').append(
            moment(event.offers.validFrom).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
            + ' - '
            + moment(event.offers.validThrough).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
        ));

    var div = $('<div>')
        .append(seller)
        .append(availability)
        .append(validity)
        .append($('<div>').addClass('table-responsive').append(table));

    modal.find('.modal-title').text('イベントオファー');
    modal.find('.modal-body').html(div);
    modal.modal();
}

/**
 * 追加特性を見る
 */
function showAdditionalProperty(id) {
    var event = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (event === undefined) {
        alert('イベント' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-event');
    var div = $('<div>')

    if (Array.isArray(event.additionalProperty)) {
        var thead = $('<thead>').addClass('text-primary');
        var tbody = $('<tbody>');
        thead.append([
            $('<tr>').append([
                $('<th>').text('Name'),
                $('<th>').text('Value')
            ])
        ]);
        tbody.append(event.additionalProperty.map(function (property) {
            return $('<tr>').append([
                $('<td>').text(property.name),
                $('<td>').text(property.value)
            ]);
        }));
        var table = $('<table>').addClass('table table-sm')
            .append([thead, tbody]);
        div.addClass('table-responsive')
            .append(table);
    } else {
        div.append($('<p>').addClass('description text-center').text('データが見つかりませんでした'));
    }

    modal.find('.modal-title').text('追加特性');
    modal.find('.modal-body').html(div);
    modal.modal();
}

function showPerformance(id) {
    var event = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (event === undefined) {
        alert('イベント' + id + 'が見つかりません');

        return;
    }

    // 編集モーダルオープン
    scheduler.showPerformance(event);
}