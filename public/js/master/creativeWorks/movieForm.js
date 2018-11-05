
$(function () {
    $('.btn-ok').on('click', function () {
        $('form').submit();
    });
    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    });
    $('.datetimepicker').datetimepicker({
        locale: 'ja',
        format: 'YYYY-MM-DDTHH:mm:ss+09:00'
    });
});
