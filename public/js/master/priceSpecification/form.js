var priceSpecificationId = '';

$(function () {
    priceSpecificationId = $('input[name="id"]').val();

    $('.btn-ok').on('click', function () {
        $(this).addClass('disabled')
            .text('processing...');

        $('form').submit();
    });
    // datepickerセット
    if ($('.datepicker').length > 0) {
        $('.datepicker').datepicker({ language: 'ja' });
    }
    if ($('.datetimepicker').length > 0) {
        $('.datetimepicker').datetimepicker({
            locale: 'ja',
            format: 'YYYY-MM-DDTHH:mm:ss+09:00'
        });
    }

    $(document).on('change', 'select[name="typeOf"]', function () {
        showAppliesToConditions($(this).val());
    });

    showAppliesToConditions($('select,input[name="typeOf"]').val());

    // 削除ボタン
    $('.btn-delete').on('click', remove);
});

/**
 * 価格仕様タイプに応じた適用条件フォームを表示する
 */
function showAppliesToConditions(priceSpecificationType) {
    $('.appliesToConditions').addClass('d-none');
    $('.appliesToConditions.' + priceSpecificationType).removeClass('d-none');
}

/**
 * 削除
 */
function remove() {
    if (window.confirm('元には戻せません。本当に削除しますか？')) {
        $.ajax({
            dataType: 'json',
            url: '/priceSpecifications/' + priceSpecificationId,
            type: 'DELETE'
        })
            .done(function () {
                alert('削除しました');
                location.href = '/priceSpecifications';
            })
            .fail(function (jqxhr, textStatus, error) {
                var message = '削除できませんでした';
                if (jqxhr.responseJSON != undefined && jqxhr.responseJSON.error != undefined) {
                    message += ': ' + jqxhr.responseJSON.error.message;
                }
                alert(message);
            })
            .always(function () {
            });
    }
}
