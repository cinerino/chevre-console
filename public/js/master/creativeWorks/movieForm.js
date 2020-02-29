
$(function () {
    $('.btn-ok').on('click', function () {
        $('form').submit();
    });

    // datepickerセット
    if ($('.datepicker').length > 0) {
        $('.datepicker').datepicker({ language: 'ja' });
    }
});
