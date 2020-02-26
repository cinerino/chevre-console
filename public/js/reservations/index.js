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
        var url = '/reservations/search';
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

    $(document).on('click', '.showUnderName', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing underName...id:', id);

        showUnderName(id);
    });

    function showUnderName(id) {
        var reservation = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (reservation === undefined) {
            alert('予約' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-reservation');
        var title = 'Reservation `' + reservation.id + '` Under Name';

        var underName = reservation.underName;
        var body = $('<dl>');
        if (underName !== undefined && underName !== null) {
            body.append($('<dt>').text('typeOf'))
                .append($('<dd>').html(underName.typeOf))
                .append($('<dt>').text('id'))
                .append($('<dd>').html(underName.id))
                .append($('<dt>').text('name'))
                .append($('<dd>').html(underName.name))
                .append($('<dt>').text('email'))
                .append($('<dd>').html(underName.email))
                .append($('<dt>').text('telephone'))
                .append($('<dd>').html(underName.telephone));
        }

        modal.find('.modal-title').html(title);
        modal.find('.modal-body').html(body);
        modal.modal();
    }
});