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

    $(document).on('click', '.showOrder', function (event) {
        var orderNumber = $(this).attr('data-orderNumber');

        showOrder(orderNumber);
    });

    $(document).on('click', '.showCustomer', function (event) {
        var orderNumber = $(this).attr('data-orderNumber');
        console.log('showing customer...orderNumber:', orderNumber);

        showCustomer(orderNumber);
    });

    $(document).on('click', '.showBroker', function (event) {
        var orderNumber = $(this).attr('data-orderNumber');

        showBroker(orderNumber);
    });

    $(document).on('click', '.showReturner', function (event) {
        var orderNumber = $(this).attr('data-orderNumber');

        showReturner(orderNumber);
    });

    $(document).on('click', '.showPaymentMethods', function (event) {
        var orderNumber = $(this).attr('data-orderNumber');

        showPaymentMethods(orderNumber);
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

    $('#customerId').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '顧客選択',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/customers/getlist',
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
                    results: data.results.map(function (customer) {
                        return {
                            id: customer.id,
                            text: customer.name.ja
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

    $('#seller').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '販売者選択',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/sellers/getlist',
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
                    results: data.results.map(function (seller) {
                        return {
                            id: seller.id,
                            text: seller.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#paymentMethodType').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '決済方法選択',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    inCodeSet: { identifier: 'PaymentMethodType' },
                    name: { $regex: params.term }
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
                    results: data.results.map(function (paymentMethodType) {
                        return {
                            id: paymentMethodType.codeValue,
                            text: paymentMethodType.name.ja
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
            url: '/projects/' + PROJECT_ID + '/orders/searchAdmins',
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

function showOrder(orderNumber) {
    var order = $.CommonMasterList.getDatas().find(function (data) {
        return data.orderNumber === orderNumber
    });
    if (order === undefined) {
        alert('注文' + orderNumber + 'が見つかりません');

        return;
    }

    var modal = $('#showModal');
    var title = '注文 `' + order.orderNumber + '`';

    var body = $('<dl>').addClass('row');
    body.append($('<dt>').addClass('col-md-3').append('注文番号'))
        .append($('<dd>').addClass('col-md-9').append(order.orderNumber))
        .append($('<dt>').addClass('col-md-3').append('確認番号'))
        .append($('<dd>').addClass('col-md-9').append(order.confirmationNumber))
        .append($('<dt>').addClass('col-md-3').append('注文日時'))
        .append($('<dd>').addClass('col-md-9').append(moment(order.orderDate).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss')))
        .append($('<dt>').addClass('col-md-3').append('ステータス'))
        .append($('<dd>').addClass('col-md-9').append(order.orderStatus));

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function showCustomer(orderNumber) {
    var order = $.CommonMasterList.getDatas().find(function (data) {
        return data.orderNumber === orderNumber
    });
    if (order === undefined) {
        alert('注文' + orderNumber + 'が見つかりません');

        return;
    }

    var modal = $('#modal-order');
    var title = '注文 `' + order.orderNumber + '` カスタマー';

    var customer = order.customer;
    var body = $('<dl>').addClass('row');
    if (customer !== undefined && customer !== null) {
        body.append($('<dt>').addClass('col-md-3').append($('<span>').text('タイプ')))
            .append($('<dd>').addClass('col-md-9').append(customer.typeOf))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('ID')))
            .append($('<dd>').addClass('col-md-9').append(customer.id))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('名称')))
            .append($('<dd>').addClass('col-md-9').append(customer.name))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('メールアドレス')))
            .append($('<dd>').addClass('col-md-9').append(customer.email))
            .append($('<dt>').addClass('col-md-3').append($('<span>').text('電話番号')))
            .append($('<dd>').addClass('col-md-9').append(customer.telephone));
    }

    if (Array.isArray(customer.identifier)) {
        var thead = $('<thead>').addClass('text-primary');
        var tbody = $('<tbody>');
        thead.append([
            $('<tr>').append([
                $('<th>').text('Name'),
                $('<th>').text('Value')
            ])
        ]);
        tbody.append(customer.identifier.map(function (property) {
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

function showBroker(orderNumber) {
    var order = $.CommonMasterList.getDatas().find(function (data) {
        return data.orderNumber === orderNumber
    });
    if (order === undefined) {
        alert('注文' + orderNumber + 'が見つかりません');

        return;
    }

    var modal = $('#modal-order');
    var title = '注文 `' + order.orderNumber + '` 仲介';

    var body = $('<div>');

    body.append($('<textarea>')
        .val(JSON.stringify(order.broker, null, '\t'))
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

function showReturner(orderNumber) {
    var order = $.CommonMasterList.getDatas().find(function (data) {
        return data.orderNumber === orderNumber
    });
    if (order === undefined) {
        alert('注文' + orderNumber + 'が見つかりません');

        return;
    }

    var modal = $('#modal-order');
    var div = $('<div>')

    div.append($('<textarea>')
        .val(JSON.stringify(order.returner, null, '\t'))
        .addClass('form-control')
        .attr({
            rows: '25',
            disabled: ''
        })
    );

    modal.find('.modal-title').text('返品者');
    modal.find('.modal-body').html(div);
    modal.modal();
}

function showPaymentMethods(orderNumber) {
    var order = $.CommonMasterList.getDatas().find(function (data) {
        return data.orderNumber === orderNumber
    });
    if (order === undefined) {
        alert('注文' + orderNumber + 'が見つかりません');

        return;
    }

    var modal = $('#modal-order');
    var div = $('<div>')

    div.append($('<textarea>')
        .val(JSON.stringify(order.paymentMethods, null, '\t'))
        .addClass('form-control')
        .attr({
            rows: '25',
            disabled: ''
        })
    );

    modal.find('.modal-title').text('決済方法');
    modal.find('.modal-body').html(div);
    modal.modal();
}

function initializeView() {
    $('.btn-cancel').addClass('disabled');

    $('input[name="selectedReservations"]:checked').prop('checked', false);
}

/**
 * 注文検索
 */
function search(pageNumber) {
    initializeView();

    conditions['page'] = pageNumber;
    var url = '/projects/' + PROJECT_ID + '/orders/search';
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
