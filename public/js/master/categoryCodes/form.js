
$(function () {
    $('.btn-ok').on('click', function () {
        $(this).prop('disabled', true)
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

});
