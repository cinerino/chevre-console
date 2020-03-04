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
        var url = '/offerCatalogs/getlist';
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

    // 関連券種グループ button
    $(document).on('click', '.popupListTicketType', function (event) {
        event.preventDefault();
        var id = $(this).attr('data-id');
        list(id);
    });

    /**
     * 関連券種グループのpopupを表示
     */
    function list(id) {
        $.ajax({
            dataType: 'json',
            url: '/offerCatalogs/' + id + '/offers',
            cache: false,
            type: 'GET',
            // data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            if (data.success) {
                var offerCatalog = $.CommonMasterList.getDatas().find(function (data) {
                    return data.id === id
                });

                var modal = $('#modal-offerCatalog');

                var div = $('<div>');

                if (data.results.length > 0) {
                    var thead = $('<thead>').addClass('text-primary')
                        .append([
                            $('<tr>').append([
                                $('<th>').text('コード'),
                                $('<th>').text('名称')
                            ])
                        ]);
                    var tbody = $('<tbody>')
                        .append(data.results.map(function (result) {
                            var url = '/offers/' + result.id + '/update';
                            if (offerCatalog.itemOffered.typeOf === 'EventService') {
                                url = '/ticketTypes/' + result.id + '/update';
                            }

                            return $('<tr>').append([
                                $('<td>').html('<a target="_blank" href="' + url + '">' + result.identifier + ' <i class="material-icons" style="font-size: 1.2em;">open_in_new</i></a>'),
                                $('<td>').text(result.name.ja)
                            ]);
                        }))
                    var table = $('<table>').addClass('table table-sm')
                        .append([thead, tbody]);

                    div.addClass('table-responsive')
                        .append(table);
                } else {
                    div.append($('<p>').addClass('description text-center').text('データが見つかりませんでした'));
                }

                modal.find('.modal-title').text('対象オファー');
                modal.find('.modal-body').html(div);
                modal.modal();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert(error);
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }

    // 追加特性を見る
    $(document).on('click', '.showAdditionalProperty', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing additionalProperty...id:', id);

        showAdditionalProperty(id);
    });

    /**
     * 追加特性を見る
     */
    function showAdditionalProperty(id) {
        var movieTheater = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (movieTheater === undefined) {
            alert('券種' + branchCode + 'が見つかりません');

            return;
        }

        var modal = $('#modal-offerCatalog');

        var div = $('<div>');

        div.append('<textarea rows="20" class="form-control" placeholder="" disabled="">'
            + JSON.stringify(movieTheater.additionalProperty, null, '\t')
            + '</textarea>');

        modal.find('.modal-title').text('追加特性');
        modal.find('.modal-body').html(div);
        modal.modal();
    }
});