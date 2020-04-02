$(function () {
    var ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })

    //Enter押下で検索
    $('form').on('keydown', function () {
        if (window.event.keyCode == 13) $('.btn-ok').click();
    });

    // 共通一覧表示初期セット・ページャセット
    $.CommonMasterList.init('#templateRow', '#searchedCount');
    $.CommonMasterList.pager('#pager', ITEMS_ON_PAGE, function (pageNumber) {
        search(pageNumber);
    });

    // 検索ボタンイベント
    var conditions = {};
    $(document).on('click', '.btn-ok', function () {
        // 検索条件取得
        conditions = $.fn.getDataFromForm('form');
        // 検索API呼び出し
        search(1);
    });

    $('.btn-ok').click();

    //--------------------------------
    // 検索API呼び出し
    //--------------------------------
    function search(pageNumber) {
        conditions['page'] = pageNumber;
        var url = '/places/movieTheater/search';
        $.ajax({
            dataType: 'json',
            url: url,
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
            alert("fail");
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }

    // 追加特性を見る
    $(document).on('click', '.showAdditionalProperty', function (event) {
        var branchCode = $(this).attr('data-branchCode');
        console.log('showing additionalProperty...branchCode:', branchCode);

        showAdditionalProperty(branchCode);
    });

    // スクリーン情報
    $(document).on('click', '.showContainsPlace', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing containsPlace...id:', id);

        showContainsPlace(id);
    });

    /**
     * 追加特性を見る
     */
    function showAdditionalProperty(branchCode) {
        var movieTheater = $.CommonMasterList.getDatas().find(function (data) {
            return data.branchCode === branchCode
        });
        if (movieTheater === undefined) {
            alert('劇場' + branchCode + 'が見つかりません');

            return;
        }

        var modal = $('#modal-additionalProperty');
        var div = $('<div>')

        if (Array.isArray(movieTheater.additionalProperty)) {
            var thead = $('<thead>').addClass('text-primary');
            var tbody = $('<tbody>');
            thead.append([
                $('<tr>').append([
                    $('<th>').text('Name'),
                    $('<th>').text('Value')
                ])
            ]);
            tbody.append(movieTheater.additionalProperty.map(function (property) {
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

    /**
     * スクリーン情報
     */
    function showContainsPlace(id) {
        var movieTheater = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (movieTheater === undefined) {
            alert('劇場' + id + 'が見つかりません');

            return;
        }

        $.ajax({
            dataType: 'json',
            url: '/places/movieTheater/' + id + '/screeningRooms',
            cache: false,
            type: 'GET',
            data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            console.log(data);
            if (data.success) {
                var modal = $('#modal-containsPlace');
                var body = modal.find('.modal-body');

                var thead = $('<thead>').addClass('text-primary')
                    .append([
                        $('<tr>').append([
                            $('<th>').text('コード'),
                            $('<th>').text('名称'),
                            $('<th>').text('セクション数'),
                            $('<th>').text('座席数')
                        ])
                    ]);
                var tbody = $('<tbody>')
                    .append(data.results.map(function (result) {
                        var screeningRoomId = movieTheater.branchCode + ':' + result.branchCode;
                        var editScreenUrl = '/places/screeningRoom/' + screeningRoomId + '/update';
                        var numSections = 0;
                        if (Array.isArray(result.containsPlace)) {
                            numSections = result.containsPlace.length;
                        }

                        return $('<tr>').append([
                            $('<td>').html('<a target="_blank" href="' + editScreenUrl + '">' + result.branchCode + ' <i class="material-icons" style="font-size: 1.2em;">open_in_new</i></a>'),
                            $('<td>').text(result.name),
                            $('<td>').text(numSections),
                            $('<td>').text(result.numSeats)
                        ]);
                    }))
                var table = $('<table>').addClass('table table-sm')
                    .append([thead, tbody]);

                var div = $('<div>').addClass('')
                    .append(table);

                body.empty().append(div);
                modal.modal();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }
});
