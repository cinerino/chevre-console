var ticketTypeGroupId = '';
var form = {
    price: ''
};

$(function () {

    ticketTypeGroupId = $('input[name="id"]').val();

    $('#price').on('change', priceChange);

    $("#sortable1, #sortable2").sortable({
        connectWith: ".connectedSortable"
    }).disableSelection();

    // show or hide 対象券種名
    var priceList = $('#sortable2 > li').length;
    if (priceList == 0) {
        // $('#sortable1').hide();
        // $('#sortable2').hide();
    }

    // form submit
    $('.btn-ok').on('click', submit);

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
            url: '/offerCatalogs/' + ticketTypeGroupId,
            type: 'DELETE'
        }).done(function () {
            alert('削除しました');
            location.href = '/offerCatalogs';
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
}

/**
 * 更新
 */
function submit() {
    var offerIds = [];

    $('#sortable2 > li').each(function () {
        var uid = $(this).attr('uid');
        offerIds.push(uid);
    });

    offerIds.forEach(function (offerId, index) {
        $('<input />').attr('type', 'hidden')
            .attr('name', 'itemListElement[' + index + '][id]')
            .attr('value', offerId)
            .appendTo('#ticketTypeGroupsForm');
    });

    $('form').submit();
}

function searchOffersByPrice(price) {
    var options = {
        dataType: 'json',
        url: '/offerCatalogs/searchOffersByPrice',
        cache: false,
        type: 'GET',
        data: {
            price: Number(price)
        }
    };
    return $.ajax(options);
}

/**
 * 券種売上金額変更
 */
function priceChange() {
    var price = $(this).val();
    if (price === '' || form.price === price) {
        return;
    }
    form.price = price;

    // 対象券種名の処理
    var selectedOfferIds = [];
    $('#sortable2 > li').each(function () {
        var uid = $(this).attr('uid');
        selectedOfferIds.push(uid);
    });
    $('#sortable1').empty();
    searchOffersByPrice(form.price)
        .then(function (data) {
            var offers = data.results;
            if (data.success) {
                var i;
                // すでに選択済の券種を除外
                offers = offers.filter(function (t) {
                    return selectedOfferIds.indexOf(t.id) < 0;
                });
                for (i in offers) {
                    $('#sortable1').append(
                        '<li class="list-group-item p-0" uid=' + offers[i].id
                        + '>'
                        + '<span class="btn btn-primary btn-block">'
                        + offers[i].name.ja
                        + '(' + Math.floor(offers[i].priceSpecification.price / offers[i].priceSpecification.referenceQuantity.value) + ')'
                        + '</span>'
                        + '</li>'
                    );
                }
                $('#sortable1').show();
                $('#sortable2').show();
            }
        }).catch(function (jqxhr, textStatus, error) {
            alert('オファーの検索に失敗しました');
        });
}