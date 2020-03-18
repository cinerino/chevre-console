$(function () {
    $('.btn-ok').on('click', function () {
        $(this).addClass('disabled')
            .text('processing...');
        $('form').submit();
    });
});
