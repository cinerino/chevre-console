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

    $(document).on('click', '.showCustomerIdentifier', function (event) {
        var orderNumber = $(this).attr('data-orderNumber');
        console.log('showing customer...orderNumber:', orderNumber);

        showCustomerIdentifier(orderNumber);
    });
});

function showCustomerIdentifier(orderNumber) {
    var report = $.CommonMasterList.getDatas().find(function (data) {
        return data.isPartOf.mainEntity.orderNumber === orderNumber
    });
    if (report === undefined) {
        alert('レポート' + orderNumber + 'が見つかりません');

        return;
    }

    var modal = $('#modal-report');
    var title = 'レポート `' + report.isPartOf.mainEntity.orderNumber + '` カスタマー識別子';

    var customer = report.isPartOf.mainEntity.customer;
    var body = $('<dl>').addClass('row');
    if (customer !== undefined && customer !== null) {
        // body.append($('<dt>').addClass('col-md-3').append($('<span>').text('タイプ')))
        //     .append($('<dd>').addClass('col-md-9').append(customer.typeOf))
        //     .append($('<dt>').addClass('col-md-3').append($('<span>').text('ID')))
        //     .append($('<dd>').addClass('col-md-9').append(customer.id))
        //     .append($('<dt>').addClass('col-md-3').append($('<span>').text('名称')))
        //     .append($('<dd>').addClass('col-md-9').append(customer.name))
        //     .append($('<dt>').addClass('col-md-3').append($('<span>').text('メールアドレス')))
        //     .append($('<dd>').addClass('col-md-9').append(customer.email))
        //     .append($('<dt>').addClass('col-md-3').append($('<span>').text('電話番号')))
        //     .append($('<dd>').addClass('col-md-9').append(customer.telephone));

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
    }

    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(body);
    modal.modal();
}

function initializeView() {
    // $('.btn-cancel').addClass('disabled');

    // $('input[name="selectedReservations"]:checked').prop('checked', false);
}

/**
 * 検索
 */
function search(pageNumber) {
    initializeView();

    conditions['page'] = pageNumber;
    var url = '/projects/' + PROJECT_ID + '/accountingReports?format=datatable';
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
