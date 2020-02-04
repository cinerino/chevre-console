
$(function () {
    var offerId = $('input[name="id"]').val();

    $('.btn-ok').on('click', function () {
        $('form').submit();
    });

    // 削除ボタン
    $('.btn-delete').on('click', function () {
        if (window.confirm('元には戻せません。本当に削除しますか？')) {
            $.ajax({
                dataType: 'json',
                url: '/addOns/' + offerId + '/update',
                type: 'DELETE'
            }).done(function () {
                alert('削除しました');
                location.href = '/addOns';
            }).fail(function (jqxhr, textStatus, error) {
                var message = '削除できませんでした';
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
