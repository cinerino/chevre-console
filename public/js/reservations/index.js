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

    $(document).on('click', '.showReservation', function (event) {
        var id = $(this).attr('data-id');

        showReservation(id);
    });

    $(document).on('click', '.showUnderName', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing underName...id:', id);

        showUnderName(id);
    });

    $(document).on('click', '.showSubReservation', function (event) {
        var id = $(this).attr('data-id');

        showSubReservation(id);
    });

    $(document).on('click', '.editAdditionalTicketText', function (event) {
        var id = $(this).attr('data-id');

        editAdditionalTicketText(id);
    });

    // 追加特性を見る
    $(document).on('click', '.showAdditionalProperty', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing additionalProperty...id:', id);

        showAdditionalProperty(id);
    });

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

    var movieSelection = $('#reservationFor\\[superEvent\\]\\[workPerformed\\]\\[identifier\\]');
    movieSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: 'コンテンツ選択',
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

    $('#application').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: 'アプリ選択',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/applications/search',
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
                    results: data.results.map(function (application) {
                        return {
                            id: application.id,
                            text: application.name
                        }
                    })
                };
            }
        }
    });

    $('#admin\\[id\\]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: 'ユーザー選択',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/reservations/searchAdmins',
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
                    results: data.results.map(function (member) {
                        return {
                            id: member.member.id,
                            text: member.member.name
                        }
                    })
                };
            }
        }
    });
});

function showReservation(id) {
    var reservation = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (reservation === undefined) {
        alert('予約' + id + 'が見つかりません');

        return;
    }

    var modal = $('#showModal');
    var title = '予約 `' + reservation.id + '`';

    var underName = reservation.underName;
    var body = $('<dl>').addClass('row');
    if (underName !== undefined && underName !== null) {
        body.append($('<dt>').addClass('col-md-3').append('ID'))
            .append($('<dd>').addClass('col-md-9').append(reservation.id))
            .append($('<dt>').addClass('col-md-3').append('予約番号'))
            .append($('<dd>').addClass('col-md-9').append(reservation.reservationNumber))
            .append($('<dt>').addClass('col-md-3').append('予約日時'))
            .append($('<dd>').addClass('col-md-9').append(moment(reservation.bookingTime).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss')))
            .append($('<dt>').addClass('col-md-3').append('ステータス'))
            .append($('<dd>').addClass('col-md-9').append(reservation.reservationStatus))
            .append($('<dt>').addClass('col-md-3').append('イベントID'))
            .append($('<dd>').addClass('col-md-9').append(reservation.reservationFor.id))
            .append($('<dt>').addClass('col-md-3').append('発券'))
            .append($('<dd>').addClass('col-md-9').append(reservation.checkedIn))
            .append($('<dt>').addClass('col-md-3').append('入場'))
            .append($('<dd>').addClass('col-md-9').append(reservation.attended));
    }

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function showUnderName(id) {
    var reservation = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (reservation === undefined) {
        alert('予約' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-reservation');
    var title = '予約 `' + reservation.id + '` チケットホルダー';

    var underName = reservation.underName;
    var body = $('<dl>').addClass('row');
    if (underName !== undefined && underName !== null) {
        body.append($('<dt>').addClass('col-md-3').append($('<span>').text('タイプ')))
            .append($('<dd>').addClass('col-md-9').append(underName.typeOf))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('ID')))
            .append($('<dd>').addClass('col-md-9').append(underName.id))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('名称')))
            .append($('<dd>').addClass('col-md-9').append(underName.name))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('メールアドレス')))
            .append($('<dd>').addClass('col-md-9').append(underName.email))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('電話番号')))
            .append($('<dd>').addClass('col-md-9').append(underName.telephone));
    }

    if (Array.isArray(underName.identifier)) {
        var thead = $('<thead>').addClass('text-primary');
        var tbody = $('<tbody>');
        thead.append([
            $('<tr>').append([
                $('<th>').text('Name'),
                $('<th>').text('Value')
            ])
        ]);
        tbody.append(underName.identifier.map(function (property) {
            return $('<tr>').append([
                $('<td>').text(property.name),
                $('<td>').text(property.value)
            ]);
        }));
        var table = $('<table>').addClass('table table-sm')
            .append([thead, tbody]);
        body.append($('<dt>').addClass('col-md-3').append($('<span>').text('識別子')))
            .append($('<dd>').addClass('col-md-9').html(table));
    } else {
        body.append($('<dt>').addClass('col-md-3').append($('<h6>').text('識別子')))
            .append($('<dd>').addClass('col-md-9').text('なし'));
    }

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function showSubReservation(id) {
    var reservation = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (reservation === undefined) {
        alert('予約' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-reservation');
    var title = '予約 `' + reservation.id + '` サブ予約';

    var body = $('<div>');

    if (Array.isArray(reservation.subReservation)) {
        var thead = $('<thead>').addClass('text-primary');
        var tbody = $('<tbody>');
        thead.append([
            $('<tr>').append([
                $('<th>').text('セクションコード'),
                $('<th>').text('座席コード')
            ])
        ]);
        tbody.append(reservation.subReservation.map(function (property) {
            return $('<tr>').append([
                $('<td>').text(property.reservedTicket.ticketedSeat.seatSection),
                $('<td>').text(property.reservedTicket.ticketedSeat.seatNumber)
            ]);
        }));
        var table = $('<table>').addClass('table table-sm')
            .append([thead, tbody]);
        body.append(table);
    } else {
        body.append($('<p>').text('なし'));
    }

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function showAdditionalProperty(id) {
    var reservation = $.CommonMasterList.getDatas().find(function (data) {
        return data.id === id
    });
    if (reservation === undefined) {
        alert('予約' + id + 'が見つかりません');

        return;
    }

    var modal = $('#modal-reservation');
    var div = $('<div>')

    if (Array.isArray(reservation.additionalProperty)) {
        var thead = $('<thead>').addClass('text-primary');
        var tbody = $('<tbody>');
        thead.append([
            $('<tr>').append([
                $('<th>').text('Name'),
                $('<th>').text('Value')
            ])
        ]);
        tbody.append(reservation.additionalProperty.map(function (property) {
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

function initializeView() {
    $('.btn-cancel').addClass('disabled');

    $('input[name="selectedReservations"]:checked').prop('checked', false);
}

/**
 * 予約検索
 */
function search(pageNumber) {
    initializeView();

    conditions['page'] = pageNumber;
    var url = '/projects/' + PROJECT_ID + '/reservations/search';
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

    // キャンセルしようとしている予約のステータス
    var reservationNodes = ids.map(function (id) {
        return $('tr[data-id="' + id + '"]', $.CommonMasterList.getListBody());
    });

    var confirmed = false;
    if (window.confirm(ids + 'をキャンセルしますか？')) {
        confirmed = true;
    }

    if (confirmed) {
        var url = '/projects/' + PROJECT_ID + '/reservations/cancel';
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'POST',
            data: { ids: ids },
            beforeSend: function () {
                reservationNodes.forEach(function (reservationNode) {
                    $('.reservationStatusTypeName', reservationNode).text('更新中...');
                });

                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            $.notify({
                message: 'キャンセルしました'
            }, {
                type: 'success'
            });
            $('.btn-cancel').addClass('disabled');
            $('input[name="selectedReservations"]:checked').prop('checked', false);

            // 表示ステータス変更
            reservationNodes.forEach(function (reservationNode) {
                $('.reservationStatusTypeName', reservationNode).text('キャンセル済');
            });
        }).fail(function (jqxhr, textStatus, error) {
            console.error(error);
            $.notify({
                message: 'キャンセルできませんでした' + error
            }, {
                type: 'danger'
            });
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
    var title = '予約 `' + reservation.id + '` 追加テキスト';

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

    var url = '/projects/' + PROJECT_ID + '/reservations/' + id;
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
            $.notify({
                message: '変更しました'
            }, {
                type: 'success'
            });
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
