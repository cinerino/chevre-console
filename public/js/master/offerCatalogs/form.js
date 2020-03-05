var ticketTypeGroupId = '';
var form = {
    price: ''
};

$(function () {

    ticketTypeGroupId = $('input[name="id"]').val();

    $('#price').on('change', priceChange);

    $('#itemOffered\\[typeOf\\]').on('change', resetOffers);

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
    // オファーリストに含まれるムビチケ券種区分リスト
    var appliesToMovieTicketTypes = [];
    var offerIds = [];

    $('#sortable2 > li').each(function () {
        var uid = $(this).attr('uid');
        offerIds.push(uid);
        var appliesToMovieTicketType = $(this).attr('appliesToMovieTicketType');
        if (appliesToMovieTicketType !== '') {
            appliesToMovieTicketTypes.push(appliesToMovieTicketType);
        }
    });

    offerIds.forEach(function (offerId, index) {
        $('<input />').attr('type', 'hidden')
            .attr('name', 'itemListElement[' + index + '][id]')
            .attr('value', offerId)
            .appendTo('#ticketTypeGroupsForm');
    });

    // ムビチケ券種区分の重複を確認
    var uniqueAppliesToMovieTicketTypes = appliesToMovieTicketTypes.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
    if (appliesToMovieTicketTypes.length !== uniqueAppliesToMovieTicketTypes.length) {
        alert('ムビチケ券種区分が重複しています');

        return false;
    }

    $('.btn-ok').prop('disabled', true)
        .text('processing...');

    $('form').submit();
}

function searchOffersByPrice(price, itemOfferedType) {
    var options = {
        dataType: 'json',
        url: '/offerCatalogs/searchOffersByPrice',
        cache: false,
        type: 'GET',
        data: {
            price: Number(price),
            itemOffered: { typeOf: itemOfferedType }
        }
    };

    return $.ajax(options);
}

/**
 * オファー売上金額変更
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

    // アイテム選択済かどうか
    const itemOfferedType = $('#itemOffered\\[typeOf\\]').val();
    if (typeof itemOfferedType !== 'string' || itemOfferedType.length <= 0) {
        alert('アイテムを選択してください');
    }

    searchOffersByPrice(form.price, itemOfferedType)
        .then(function (data) {
            var offers = data.results;
            if (data.success) {
                var i;
                // すでに選択済のオファーを除外
                offers = offers.filter(function (t) {
                    return selectedOfferIds.indexOf(t.id) < 0;
                });
                for (i in offers) {
                    var appliesToMovieTicketType = '';
                    if (typeof offers[i].priceSpecification.appliesToMovieTicketType === 'string') {
                        appliesToMovieTicketType = offers[i].priceSpecification.appliesToMovieTicketType;
                    }

                    var text = offers[i].alternateName.ja
                        + '('
                        + offers[i].priceSpecification.price + ' / ' + offers[i].priceSpecification.referenceQuantity.value
                        + ')';
                    var span = $('<span>').addClass('btn btn-primary btn-block')
                        .text(text);
                    var li = $('<li>').addClass('list-group-item p-0')
                        .attr({
                            uid: offers[i].id,
                            appliesToMovieTicketType: appliesToMovieTicketType
                        })
                        .html(span);
                    $('#sortable1').append(li);
                }
                $('#sortable1').show();
                $('#sortable2').show();
            }
        }).catch(function (jqxhr, textStatus, error) {
            alert('オファーの検索に失敗しました');
        });
}

function resetOffers() {
    $('#sortable1').empty();
    $('#sortable2').empty();
}