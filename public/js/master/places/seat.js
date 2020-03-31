$(function () {
    $('.btn-ok').on('click', function () {
        $(this).addClass('disabled')
            .text('processing...');
        $('form').submit();
    });

    // 削除ボタン
    $('.btn-delete').on('click', function () {
        var id = $(this).attr('data-id');

        remove(id);
    });

    var screenBranchCodeSelection = $('#screenBranchCode');
    screenBranchCodeSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: 'スクリーン選択',
        allowClear: true,
        ajax: {
            url: '/places/screeningRoom/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 20,
                    page: 1,
                    branchCode: { $regex: params.term }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (screeningRoom) {
                        return {
                            id: screeningRoom.branchCode,
                            text: screeningRoom.containedInPlace.name.ja + ' ' + screeningRoom.branchCode + ' ' + screeningRoom.name.ja
                        }
                    })
                };
            }
        }
    });

    var screeningRoomSectionBranchCodeSelection = $('#screeningRoomSectionBranchCode');
    screeningRoomSectionBranchCodeSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: 'セクション選択',
        allowClear: true,
        ajax: {
            url: '/places/screeningRoomSection/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 20,
                    page: 1,
                    branchCode: { $regex: params.term }
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            },
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                // movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.results.map(function (screeningRoomSection) {
                        return {
                            id: screeningRoomSection.branchCode,
                            text: screeningRoomSection.branchCode + ' ' + screeningRoomSection.name.ja
                        }
                    })
                };
            }
        }
    });
});

/**
 * 削除
 */
function remove(id) {
    if (window.confirm('元には戻せません。本当に削除しますか？')) {
        $.ajax({
            dataType: 'json',
            url: '/places/seat/' + id,
            type: 'DELETE'
        })
            .done(function () {
                alert('削除しました');
                location.href = '/places/seat';
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
