var conditions = {};

$(function () {
    var ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })

    //Enter押下で検索
    $('form.search').on('keydown', function () {
        if (window.event.keyCode == 13) $('.btn-ok').click();
    });

    // 共通一覧表示初期セット・ページャセット
    $.CommonMasterList.init('#templateRow', '#searchedCount');
    $.CommonMasterList.pager('#pager', ITEMS_ON_PAGE, function (pageNumber) {
        search(pageNumber);
    });

    // 検索ボタンイベント
    $(document).on('click', '.btn-ok', function () {
        // 検索条件取得
        conditions = $.fn.getDataFromForm('form.search');
        // 検索API呼び出し
        search(1);
    });

    $('.btn-ok').click();

    $(document).on('click', '.showOwnedBy', function (event) {
        var id = $(this).attr('data-id');

        showOwnedBy(id);
    });

    $(document).on('click', '.showTypeOfGood', function (event) {
        var id = $(this).attr('data-id');

        showTypeOfGood(id);
    });
});

function showOwnedBy(id) {
    var ownershipInfo = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (ownershipInfo === undefined) {
        alert('所有権' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-ownershipInfo');
    var title = '所有権 `' + ownershipInfo.id + '` 所有者';

    var body = $('<div>');

    body.append($('<textarea>')
        .val(JSON.stringify(ownershipInfo.ownedBy, null, '\t'))
        .addClass('form-control')
        .attr({
            rows: '25',
            disabled: ''
        })
    );

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function showTypeOfGood(id) {
    var ownershipInfo = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (ownershipInfo === undefined) {
        alert('所有権' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-ownershipInfo');
    var title = '所有権 `' + ownershipInfo.id + '` 所有物';

    var body = $('<div>');

    body.append($('<textarea>')
        .val(JSON.stringify(ownershipInfo.typeOfGood, null, '\t'))
        .addClass('form-control')
        .attr({
            rows: '25',
            disabled: ''
        })
    );

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function initializeView() {
    $('.btn-cancel').addClass('disabled');

    $('input[name="selectedReservations"]:checked').prop('checked', false);
}

/**
 * 検索
 */
function search(pageNumber) {
    initializeView();

    conditions['page'] = pageNumber;
    var url = '/projects/' + PROJECT_ID + '/ownershipInfos/search';
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
        alert(error);
    }).always(function (data) {
        $('#loadingModal').modal('hide');
    });
}
