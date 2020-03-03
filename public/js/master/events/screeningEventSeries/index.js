$(function () {
    var ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })

    //Enter押下で検索
    $('form').on('keydown', function () {
        if (window.event.keyCode == 13) $('.btn-ok').click();
    });

    // 共通一覧表示初期セット・ページャセット
    $.CommonMasterList.init('#templateRow', '#searchedCount');
    $.CommonMasterList.pager('#pager', ITEMS_ON_PAGE, function (pageNumber) {
        search(pageNumber);
    });

    // 検索ボタンイベント
    var conditions = {};
    $(document).on('click', '.btn-ok', function () {
        // 検索条件取得
        conditions = $.fn.getDataFromForm('form');
        // 検索API呼び出し
        search(1);
    });

    $('.btn-ok').click();

    var movieSelection = $('#workPerformed\\[identifier\\]');
    movieSelection.select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '作品選択',
        allowClear: true,
        ajax: {
            url: '/creativeWorks/movie/getlist',
            dataType: 'json',
            data: function (params) {
                var query = {
                    name: params.term
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
                    results: data.results.map(function (movie) {
                        return {
                            id: movie.identifier,
                            text: movie.name
                        }
                    })
                };
            }
        }
    });

    //--------------------------------
    // 検索API呼び出し
    //--------------------------------
    function search(pageNumber) {
        conditions['limit'] = ITEMS_ON_PAGE;
        conditions['page'] = pageNumber;
        var url = '/events/screeningEventSeries/getlist';
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            if (data.success) {
                //alert("success:" + data.count);
                var dataCount = (data.count) ? (data.count) : 0;
                // 一覧表示
                if ($.CommonMasterList.bind(data.results, dataCount, pageNumber)) {
                    $('#list').show();
                } else {
                    $('#list').hide();
                }
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }

    // 追加特性を見る
    $(document).on('click', '.showAdditionalProperty', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing additionalProperty...id:', id);

        showAdditionalProperty(id);
    });

    /**
     * 追加特性を見る
     */
    function showAdditionalProperty(id) {
        var movie = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (movie === undefined) {
            alert('イベント' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-additionalProperty');
        var body = modal.find('.modal-body');
        body.empty()
        var html = '<textarea rows="20" class="form-control" placeholder="" disabled="">'
            + JSON.stringify(movie.additionalProperty, null, '\t')
            + '</textarea>'
        body.append(html);
        modal.modal();
    }
});

