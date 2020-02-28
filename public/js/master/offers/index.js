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
        var url = '/offers/getlist';
        // alert(JSON.stringify(conditions));
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
                // 検索条件表示
                $.fn.setDataToForm('form', conditions);
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
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

        var modal = $('#modal-additionalProperty');
        var body = modal.find('.modal-body');
        body.empty()
        var html = '<textarea rows="20" class="form-control" placeholder="" disabled="">'
            + JSON.stringify(movieTheater.additionalProperty, null, '\t')
            + '</textarea>'
        body.append(html);
        modal.modal();
    }

    // カタログ表示
    $(document).on('click', '.showCatalogs', function (event) {
        event.preventDefault();
        var id = $(this).attr('data-id');
        showCatalogs(id);
    });

    function showCatalogs(id) {
        console.log('requesting...', id);
        $.ajax({
            dataType: 'json',
            url: '/offers/' + id + '/catalogs',
            cache: false,
            type: 'GET',
            // data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            if (data.success) {
                var modal = $('#offerCatalogs');

                var body = $('<p>').text('データが見つかりませんでした');
                var tbody = $('<tbody>');
                if (data.results.length > 0) {
                    data.results.forEach(function (offerCatalog) {
                        var href = '/offerCatalogs/' + offerCatalog.id + '/update';
                        var identifier = $('<a>').attr({ 'href': href, target: '_blank' }).text(offerCatalog.identifier);
                        tbody.append(
                            $('<tr>')
                                .append($('<td>').html(identifier))
                                .append($('<td>').text(offerCatalog.name.ja))
                        );
                    });
                    var thead = $('<thead>').addClass('text-primary')
                        .append(
                            $('<tr>')
                                .append($('<th>').text('コード'))
                                .append($('<th>').text('名称'))
                        );
                    var table = $('<table>').addClass('table table-sm')
                        .append(thead)
                        .append(tbody)
                    var body = $('<div>').addClass('table-responsive')
                        .append(table)
                }

                modal.find('.modal-body').html(body);
                modal.modal();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert(error);
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }
});