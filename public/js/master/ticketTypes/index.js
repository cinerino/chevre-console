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
        var url = '/ticketTypes/getlist';
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
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }

    // 関連券種グループ button
    $(document).on('click', '.popupListTicketTypeGroup', function (event) {
        event.preventDefault();
        var id = $(this).attr('data-id');
        list(id);
    });

    /**
     * 関連券種グループのpopupを表示
     */
    function list(id) {
        console.log('requesting...', id);
        $.ajax({
            dataType: 'json',
            url: '/ticketTypes/getTicketTypeGroupList/' + id,
            cache: false,
            type: 'GET',
            // data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            if (data.success) {
                var modal = $('#listModal');
                var listTicketTypeGroup = modal.find('#listTicketTypeGroup');
                listTicketTypeGroup.empty();
                if (data.results.length > 0) {
                    for (let i = 0; i < data.results.length; i++) {
                        listTicketTypeGroup.append(`<tr><td>${data.results[i].name.ja}</td></tr>`);
                    }
                } else {
                    listTicketTypeGroup.append(`<tr><td>データがありません。</td></tr>`);
                }
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

    $(document).on('click', '.showAddOn', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing addOn...id:', id);

        showAddOn(id);
    });

    /**
     * 追加特性を見る
     */
    function showAdditionalProperty(id) {
        var movieTheater = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (movieTheater === undefined) {
            alert('券種' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-offer');
        var body = modal.find('.modal-body');
        body.empty()
        var html = '<textarea rows="20" class="form-control" placeholder="" disabled="">'
            + JSON.stringify(movieTheater.additionalProperty, null, '\t')
            + '</textarea>'
        modal.find('.modal-title').text('追加特性');
        body.append(html);
        modal.modal();
    }

    function showAddOn(id) {
        var offer = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (offer === undefined) {
            alert('券種' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-offer');
        var html = '<textarea rows="20" class="form-control" placeholder="" disabled="">'
            + JSON.stringify(offer.addOn, null, '\t')
            + '</textarea>'
        modal.find('.modal-title').text('アドオン');
        modal.find('.modal-body').html(html);
        modal.modal();
    }

    // COA券種インポート
    $('a.importFromCOA').click(function () {
        var message = 'COA券種をインポートしようとしています。'
            + '\nよろしいですか？';

        if (window.confirm(message)) {
            $.ajax({
                url: '/ticketTypes/importFromCOA',
                type: 'POST',
                dataType: 'json',
                data: $('form').serialize()
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
});