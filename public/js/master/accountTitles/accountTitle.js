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

    // 細目検索ボタンイベント
    var conditions = {};
    $(document).on('click', '.searchAccountTitle .btn-ok', function () {
        // 検索条件取得
        conditions = $.fn.getDataFromForm('form');
        // 検索API呼び出し
        search(1);
    });

    // 細目編集ボタン
    $(document).on('click', 'a.editAccountTitle', function () {
        var codeValue = $(this).html();
        var url = '/accountTitles/' + codeValue;
        open(url);
    });

    // 科目編集ボタン
    $(document).on('click', 'a.editAccountTitleSet', function () {
        var codeValue = $(this).html();
        var url = '/accountTitles/accountTitleSet/' + codeValue;
        open(url);
    });

    // 科目分類編集ボタン
    $(document).on('click', 'a.editAccountTitleCategory', function () {
        var codeValue = $(this).html();
        var url = '/accountTitles/accountTitleCategory/' + codeValue;
        open(url);
    });

    // 検索条件クリア
    $(document).on('click', '.reset-condition', function () {
        $.fn.clearFormValue('form');
    });

    function search(pageNumber) {
        conditions['limit'] = ITEMS_ON_PAGE;
        conditions['page'] = pageNumber;
        var url = '/accountTitles/getlist';
        //alert(JSON.stringify(conditions));
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            data: conditions,
            beforeSend: function () {
                $('.loading').modal();
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
                // 検索条件表示
                $.fn.setDataToForm('form', conditions);
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('.loading').modal('hide');
        });
    }

    // 追加特性を見る
    $(document).on('click', '.showAdditionalProperty', function (event) {
        var codeValue = $('a.editAccountTitle', $(this).parent().parent()).html();
        console.log('showing additionalProperty...codeValue:', codeValue);

        showAdditionalProperty(codeValue);
    });

    /**
     * 追加特性を見る
     */
    function showAdditionalProperty(codeValue) {
        var accountTitle = $.CommonMasterList.getDatas().find(function (data) {
            return data.codeValue === codeValue
        });
        if (accountTitle === undefined) {
            alert('細目コード' + codeValue + 'が見つかりません');

            return;
        }

        var modal = $('#modal-additionalProperty');
        var body = modal.find('.modal-body');
        body.empty()
        var html = '<textarea rows="20" class="form-control" placeholder="" disabled="">'
            + JSON.stringify(accountTitle.additionalProperty, null, '\t')
            + '</textarea>'
        body.append(html);
        modal.modal();
    }
});
