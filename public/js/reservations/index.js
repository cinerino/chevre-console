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

    $(document).on('click', '.showUnderName', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing underName...id:', id);

        showUnderName(id);
    });

    $(document).on('click', '.editAdditionalTicketText', function (event) {
        var id = $(this).attr('data-id');

        editAdditionalTicketText(id);
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

    // キャンセルボタンイベント
    $(document).on('click', '.btn-cancel', function () {
        cancelReservations();
    });

    $(document).on('change', 'input[name="selectedReservations"]', function () {
        var selectedReservations = getSelectedReservations();
        console.log(selectedReservations.length, 'selected');
        var selectedReservationsExist = selectedReservations.length > 0;

        var isAllConfimed = true;
        selectedReservations.forEach(function (selectedReservation) {
            if (selectedReservation.reservationStatus !== 'ReservationConfirmed') {
                isAllConfimed = false;
            }
        });

        if (selectedReservationsExist && isAllConfimed) {
            $('.btn-cancel').removeClass('disabled');
        } else {
            $('.btn-cancel').addClass('disabled');
        }
    });

    // 更新ボタンイベント
    $(document).on('click', '#modal-edit .btn-update', function () {
        update();
    });
});

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
        }
    }).fail(function (jqxhr, textStatus, error) {
        alert("fail");
    }).always(function (data) {
        $('#loadingModal').modal('hide');
    });
}

function getSelectedReservations() {
    var selectedReservationBoxes = $('input[name="selectedReservations"]:checked');

    var selectedReservationIds = [];
    selectedReservationBoxes.each(function () {
        selectedReservationIds.push($(this).val());
    });

    var selectedReservations = $.CommonMasterList.getDatas()
        .filter(function (data) {
            return selectedReservationIds.indexOf(data.id) >= 0;
            // }).filter(function (data) {
            //     return data.reservationStatus === 'ReservationConfirmed';
        });

    return selectedReservations;
}

function cancelReservations() {
    var selectedReservations = getSelectedReservations();

    var isAllConfimed = true;
    selectedReservations.forEach(function (selectedReservation) {
        if (selectedReservation.reservationStatus !== 'ReservationConfirmed') {
            isAllConfimed = false;
        }
    });
    if (!isAllConfimed) {
        alert('確定予約のみキャンセル可能です');

        return;
    }

    var ids = selectedReservations.map(function (r) {
        return r.id;
    });

    var confirmed = false;
    if (window.confirm(ids + 'をキャンセルしますか？')) {
        confirmed = true;
    }

    if (confirmed) {
        var url = '/reservations/cancel';
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'POST',
            data: { ids: ids },
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            alert('キャンセルしました');
            $('.btn-cancel').addClass('disabled');
            $('input[name="selectedReservations"]:checked').prop('checked', false);
            search(1);
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }
}

function editAdditionalTicketText(id) {
    var reservation = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (reservation === undefined) {
        alert('予約' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-edit');
    var title = '予約 `' + reservation.id + '` の追加テキスト';

    var body = $('<form>').addClass('edit');
    body.append(
        $('<input>')
            .attr({
                type: 'hidden',
                name: 'id',
                value: reservation.id
            })
    ).append(
        $('<input>')
            .addClass('form-control')
            .attr({
                type: 'text',
                name: 'additionalTicketText',
                value: reservation.additionalTicketText
            })
    );

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function update() {
    var modal = $('#modal-edit');

    var id = $('input[name="id"]', modal).val();

    console.log('updating...', id, $('form.edit').serialize());

    var url = '/reservations/' + id;
    $.ajax({
        dataType: 'json',
        url: url,
        cache: false,
        type: 'PATCH',
        data: $('form.edit').serialize(),
        beforeSend: function () {
            $('#loadingModal').modal({ backdrop: 'static' });
        }
    })
        .done(function (data) {
            alert('変更しました');
            modal.modal('hide');
            search(1);
        })
        .fail(function (xhr, textStatus, error) {
            var message = error;
            try {
                var res = xhr.responseJSON;
                if (typeof res.message === 'string') {
                    message = res.message;
                }
            } catch (e) {
            }

            alert('変更できませんでした: ' + message);
        })
        .always(function (data) {
            $('#loadingModal').modal('hide');
        });
}
