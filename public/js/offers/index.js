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

    //--------------------------------
    // 検索API呼び出し
    //--------------------------------
    function search(pageNumber) {
        conditions['page'] = pageNumber;
        var url = '/projects/' + PROJECT_ID + '/offers/getlist';
        // alert(JSON.stringify(conditions));
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

    // オファー追加
    $(document).on('click', '.createOffer', function (event) {
        conditions = $.fn.getDataFromForm('form');
        var itemOfferedTypeOf = conditions['itemOffered[typeOf]'];
        if (typeof itemOfferedTypeOf !== 'string' || itemOfferedTypeOf.length === 0) {
            alert('アイテムを指定してください');

            return;
        }

        location.href = '/projects/' + PROJECT_ID + '/offers/add?itemOffered[typeOf]=' + itemOfferedTypeOf;
    });

    // 追加特性を見る
    $(document).on('click', '.showAdditionalProperty', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing additionalProperty...id:', id);

        showAdditionalProperty(id);
    });

    // カタログ表示
    $(document).on('click', '.showCatalogs', function (event) {
        event.preventDefault();
        var id = $(this).attr('data-id');
        showCatalogs(id);
    });

    // 利用可能アプリケーション表示
    $(document).on('click', '.showAvailableAtOrFrom', function (event) {
        event.preventDefault();
        var id = $(this).attr('data-id');
        showAvailableAtOrFrom(id);
    });

    $(document).on('click', '.showAddOn', function (event) {
        var id = $(this).attr('data-id');
        console.log('showing addOn...id:', id);

        showAddOn(id);
    });

    $('#application').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/applications/search',
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
                    results: data.results.map(function (application) {
                        return {
                            id: application.id,
                            text: application.name
                        }
                    })
                };
            }
        }
    });

    $('#category\\[codeValue\\]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    inCodeSet: { identifier: 'OfferCategoryType' }
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
                    results: data.results.map(function (categoryCode) {
                        return {
                            id: categoryCode.codeValue,
                            text: categoryCode.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#appliesToMovieTicket').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    inCodeSet: { identifier: 'MovieTicketType' }
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
                    results: data.results.map(function (categoryCode) {
                        return {
                            id: JSON.stringify({ codeValue: categoryCode.codeValue, paymentMethod: categoryCode.paymentMethod }),
                            text: categoryCode.paymentMethod.typeOf + ' ' + categoryCode.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#eligibleSeatingType').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    inCodeSet: { identifier: 'SeatingType' }
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
                    results: data.results.map(function (categoryCode) {
                        return {
                            id: categoryCode.codeValue,
                            text: categoryCode.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#eligibleMembershipType').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    inCodeSet: { identifier: 'MembershipType' }
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
                    results: data.results.map(function (categoryCode) {
                        return {
                            id: categoryCode.codeValue,
                            text: categoryCode.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#eligibleMonetaryAmount\\[currency\\]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/categoryCodes/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
                    name: { $regex: params.term },
                    inCodeSet: { identifier: 'CurrencyType' }
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
                    results: data.results.map(function (categoryCode) {
                        return {
                            id: categoryCode.codeValue,
                            text: categoryCode.name.ja
                        }
                    })
                };
            }
        }
    });

    $('#accountTitle\\[codeValue\\]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/accountTitles/getlist',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    page: 1,
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
                    results: data.results.map(function (accountTitle) {
                        return {
                            id: accountTitle.codeValue,
                            text: accountTitle.name
                        }
                    })
                };
            }
        }
    });

    $('#addOn\\[itemOffered\\]\\[id\\]').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '選択する',
        allowClear: true,
        ajax: {
            url: '/projects/' + PROJECT_ID + '/products/search',
            dataType: 'json',
            data: function (params) {
                var query = {
                    limit: 100,
                    typeOf: { $eq: 'Product' },
                    page: 1,
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
                    results: data.results.map(function (product) {
                        return {
                            id: product.id,
                            text: product.name.ja
                        }
                    })
                };
            }
        }
    });

    /**
     * 追加特性を見る
     */
    function showAdditionalProperty(id) {
        var offer = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (offer === undefined) {
            alert('オファー' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-offer');
        var div = $('<div>')

        if (Array.isArray(offer.additionalProperty)) {
            var thead = $('<thead>').addClass('text-primary');
            var tbody = $('<tbody>');
            thead.append([
                $('<tr>').append([
                    $('<th>').text('Name'),
                    $('<th>').text('Value')
                ])
            ]);
            tbody.append(offer.additionalProperty.map(function (property) {
                return $('<tr>').append([
                    $('<td>').text(property.name),
                    $('<td>').text(property.value)
                ]);
            }));
            var table = $('<table>').addClass('table table-sm')
                .append([thead, tbody]);
            div.addClass('table-responsive')
                .append(table);
        } else {
            div.append($('<p>').addClass('description text-center').text('データが見つかりませんでした'));
        }

        modal.find('.modal-title').text('追加特性');
        modal.find('.modal-body').html(div);
        modal.modal();
    }

    function showCatalogs(id) {
        $.ajax({
            dataType: 'json',
            url: '/projects/' + PROJECT_ID + '/offers/' + id + '/catalogs',
            cache: false,
            type: 'GET',
            // data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            if (data.success) {
                var modal = $('#modal-offer');

                var body = $('<p>').text('データが見つかりませんでした');
                if (data.results.length > 0) {
                    var tbody = $('<tbody>');
                    data.results.forEach(function (offerCatalog) {
                        var href = '/projects/' + PROJECT_ID + '/offerCatalogs/' + offerCatalog.id + '/update';
                        var identifier = $('<a>').attr({ 'href': href, target: '_blank' }).text(offerCatalog.identifier);
                        tbody.append(
                            $('<tr>')
                                .append($('<td>').html(identifier))
                                .append($('<td>').text(offerCatalog.name.ja))
                        );
                    });
                    var thead = $('<thead>').addClass('text-primary')
                        .append(
                            $('<tr>')
                                .append($('<th>').text('コード'))
                                .append($('<th>').text('名称'))
                        );
                    var table = $('<table>').addClass('table table-sm')
                        .append(thead)
                        .append(tbody)
                    body = $('<div>').addClass('table-responsive')
                        .append(table)
                }

                modal.find('.modal-title').text('関連カタログ');
                modal.find('.modal-body').html(body);
                modal.modal();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert(error);
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }

    function showAvailableAtOrFrom(id) {
        $.ajax({
            dataType: 'json',
            url: '/projects/' + PROJECT_ID + '/offers/' + id + '/availableApplications',
            cache: false,
            type: 'GET',
            // data: conditions,
            beforeSend: function () {
                $('#loadingModal').modal({ backdrop: 'static' });
            }
        }).done(function (data) {
            if (data.success) {
                var modal = $('#modal-offer');

                var body = $('<p>').text('データが見つかりませんでした');
                if (data.results.length > 0) {
                    var tbody = $('<tbody>');
                    data.results.forEach(function (application) {
                        tbody.append(
                            $('<tr>')
                                .append($('<td>').text(application.id))
                                .append($('<td>').text(application.name))
                        );
                    });
                    var thead = $('<thead>').addClass('text-primary')
                        .append(
                            $('<tr>')
                                .append($('<th>').text('ID'))
                                .append($('<th>').text('名称'))
                        );
                    var table = $('<table>').addClass('table table-sm')
                        .append(thead)
                        .append(tbody)
                    body = $('<div>').addClass('table-responsive')
                        .append(table)
                }

                modal.find('.modal-title').text('利用可能アプリケーション');
                modal.find('.modal-body').html(body);
                modal.modal();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert(error);
        }).always(function (data) {
            $('#loadingModal').modal('hide');
        });
    }

    function showAddOn(id) {
        var offer = $.CommonMasterList.getDatas().find(function (data) {
            return data.id === id
        });
        if (offer === undefined) {
            alert('オファー' + id + 'が見つかりません');

            return;
        }

        var modal = $('#modal-offer');
        var div = $('<div>')

        if (Array.isArray(offer.addOn)) {
            var thead = $('<thead>').addClass('text-primary');
            var tbody = $('<tbody>');
            thead.append([
                $('<tr>').append([
                    $('<th>').text('名称')
                ])
            ]);
            tbody.append(offer.addOn.map(function (offer) {
                var href = '/projects/' + PROJECT_ID + '/products/' + offer.itemOffered.id;
                return $('<tr>').append([
                    $('<td>').html($('<a>').attr({ href, href, target: '_blank' }).text(offer.itemOffered.name.ja))
                ]);
            }));
            var table = $('<table>').addClass('table table-sm')
                .append([thead, tbody]);
            div.addClass('table-responsive')
                .append(table);
        } else {
            div.append($('<p>').addClass('description text-center').text('データが見つかりませんでした'));
        }

        modal.find('.modal-title').text('アドオン');
        modal.find('.modal-body').html(div);
        modal.modal();
    }

    // COA券種インポート
    $('a.importFromCOA').click(function () {
        var message = 'COA券種をインポートしようとしています。'
            + '\nよろしいですか？';

        if (window.confirm(message)) {
            $.ajax({
                url: '/projects/' + PROJECT_ID + '/ticketTypes/importFromCOA',
                type: 'POST',
                dataType: 'json',
                data: $('form').serialize()
            }).done(function (tasks) {
                console.log(tasks);
                alert('インポートを開始しました');
            }).fail(function (xhr) {
                var res = $.parseJSON(xhr.responseText);
                alert(res.error.message);
            }).always(function () {
            });
        } else {
        }
    });
});