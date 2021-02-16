$(function () {
    $('a[disabled=disabled]').on('click', function (event) {
        event.preventDefault();
    });

    $('[data-toggle="tooltip"]').tooltip({
        html: true
    });
})