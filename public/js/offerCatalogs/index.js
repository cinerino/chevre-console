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
        var url = '/projects/' + PROJECT_ID + '/offerCatalogs/getlist';
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

    // 関連カタログ button
    $(document).on('click', '.popupListTicketType', function (event) {
        event.preventDefault();
        var id = $(this).attr('data-id');
        list(id);
    });

    /**
     * 関連カタログのpopupを表示
     */
    function list(id) {
        $.ajax({
            dataType: 'json',
            url: '/projects/' + PROJECT_ID + '/offerCatalogs/' + id + '/offers',
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
                            var url = '/projects/' + PROJECT_ID + '/offers/' + result.id + '/update';
                            if (offerCatalog.itemOffered.typeOf === 'EventService') {
                                url = '/projects/' + PROJECT_ID + '/ticketTypes/' + result.id + '/update';
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
        var catalog = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (catalog === undefined) {
            alert('カタログ' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-offerCatalog');
        var div = $('<div>')

        if (Array.isArray(catalog.additionalProperty)) {
            var thead = $('<thead>').addClass('text-primary');
            var tbody = $('<tbody>');
            thead.append([
                $('<tr>').append([
                    $('<th>').text('Name'),
                    $('<th>').text('Value')
                ])
            ]);
            tbody.append(catalog.additionalProperty.map(function (property) {
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

    var serviceTypeSelection = $('#itemOffered\\[serviceType\\]\\[codeValue\\]\\[\\$eq\\]');
    serviceTypeSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    inCodeSet: { identifier: 'ServiceType' }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                console.log(data);
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (categoryCode) {
                        return {
                            id: categoryCode.codeValue,
                            text: categoryCode.name.ja
                        }
                    })
                };
            }
        }
    });
});