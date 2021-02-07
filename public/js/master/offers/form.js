var offerId = '';

$(function () {
    offerId = $('input[name="id"]').val();

    $('.btn-ok').on('click', function () {
        $(this).addClass('disabled')
            .text('processing...');

        $('form').submit();
    });

    $("input#color").ColorPickerSliders({
        placement: 'bottom',
        color: '#333333',
        swatches: [
            '#333333', '#7F7F7F', '#7C1C20', '#DA413C',
            '#EF8641', '#FFEC32', '#5BA94A', '#3FA4E5',
            '#3458CA', '#9559A4', '#FFFFFF', '#C3C3C3',
            '#B07C5C', '#F3B5CB', '#F9C736', '#EFE2B3',
            '#C4DE2D', '#A6D8E8', '#7594BC', '#C5C3E6'
        ],
        customswatches: false,
        order: {},
        onchange: function (container, color) {
            $("#hiddenColor").text(color.tiny.toHexString());
            //$("#hiddenColor").text(color.tiny.toRgbString());
        }
    });

    if ($('.datepicker').length > 0) {
        $('.datepicker').datepicker({ language: 'ja' });
    }
    // if ($('.datetimepicker').length > 0) {
    //     $('.datetimepicker').datetimepicker({
    //         locale: 'ja',
    //         format: 'YYYY-MM-DDTHH:mm:ss+09:00'
    //     });
    // }

    // 削除ボタン
    $('.btn-delete').on('click', remove);
});

/**
 * 削除
 */
function remove() {
    if (window.confirm('元には戻せません。本当に削除しますか？')) {
        $.ajax({
            dataType: 'json',
            url: '/projects/' + PROJECT_ID + '/offers/' + offerId,
            type: 'DELETE'
        })
            .done(function () {
                alert('削除しました');
                location.href = '/projects/' + PROJECT_ID + '/offers';
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
