
$(function () {
    // 集計ボタン
    $('.aggregate').on('click', function () {
        if (window.confirm('元には戻せません。本当に集計しますか？')) {
            $.ajax({
                dataType: 'json',
                url: '/projects/aggregate',
                type: 'POST'
            }).done(function () {
                alert('集計を開始しました');
                // location.href = '/products';
            }).fail(function (jqxhr, textStatus, error) {
                var message = '集計を開始できませんでした';
                if (jqxhr.responseJSON != undefined && jqxhr.responseJSON.error != undefined) {
                    message += ': ' + jqxhr.responseJSON.error.message;
                }
                alert(message);
            }).always(function () {
            });
        } else {
        }
    });
});
