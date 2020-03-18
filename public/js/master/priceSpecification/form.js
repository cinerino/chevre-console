
$(function () {
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
});

/**
 * 価格仕様タイプに応じた適用条件フォームを表示する
 */
function showAppliesToConditions(priceSpecificationType) {
    $('.appliesToConditions').addClass('d-none');
    $('.appliesToConditions.' + priceSpecificationType).removeClass('d-none');
}
