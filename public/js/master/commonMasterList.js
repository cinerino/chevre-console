$(function () {
    $.CommonMasterList = $.CommonMasterList || {};
    $.CommonMasterList = {
        _listTableBodySelector: "",
        _templateRowSelector: "#templateRow",
        _searchedCountAreaSelector: "#searchedCount",
        _resultStatsSelector: "#datatables_info",
        _searchedCountText: null,
        _startTag: '',
        _endTag: '',
        _pagerSelector: '',
        _itemsOnPage: 10,
        _listNames: [],
        _listCols: {},
        /**
         * 現在表示中のデータリスト
         */
        _datas: [],

        onPageChanging: function (pageNumber) { },
        getListBody: function () {
            return ($(this._listTableBodySelector))
        },
        getTemplateRow: function () {
            return ($(this._templateRowSelector))
        },
        getSearchedCountArea: function () {
            return ($(this._searchedCountAreaSelector))
        },
        getResultStats: function () {
            return ($(this._resultStatsSelector))
        },
        getPager: function () {
            return ($(this._pagerSelector))
        },
        //----------------------
        // init: 初期化
        //----------------------
        init: function (templateRowSelector, searchedCountAreaSelector) {
            this._listTableBodySelector = $(templateRowSelector).closest('tbody');
            this._templateRowSelector = templateRowSelector;
            this._searchedCountAreaSelector = searchedCountAreaSelector;
            this._searchedCountText = this.getSearchedCountArea().text();
            var templateRow = this.getTemplateRow();
            this._startTag = templateRow.startTag();
            this._endTag = templateRow.endTag();
            // templateRowより各セルのnameをセット
            templateRow.find("td").each(
                function (index, td) {
                    $.CommonMasterList._listNames[index] = $(td).attr("name");
                }
            );
            // [name:各セルのhtml文字列]のリストをセット
            $.each(this._listNames, function (index, name) {
                $.CommonMasterList._listCols[name] = templateRow.find('[name="' + name + '"]').prop('outerHTML');
            });
        },
        //----------------------
        // pager: ページャセット
        //----------------------
        pager: function (pagerSelector, itemsOnPage, onPageChanging) {
            this._pagerSelector = pagerSelector;
            this._itemsOnPage = itemsOnPage;
            var pager = this.getPager().hide();
            pager.pagination({
                // items: 100,
                itemsOnPage: itemsOnPage,
                cssStyle: 'light-theme',
                displayedPages: 3,
                edges: 0,
                onPageClick: function (pageNumber) {
                    onPageChanging(pageNumber);
                }
            })
            pager.hide();
        },

        //----------------------
        // bind: データ分の表示行作成
        //----------------------
        bind: function (datas, countData, pageNumber) {
            this._datas = datas;

            // pager取得
            var pager = this.getPager().hide();

            // 件数表示
            // var searchedCountArea = this.getSearchedCountArea();
            // searchedCountArea.text(this._searchedCountText.replace("\$searched_count\$", countData));
            // searchedCountArea.show();

            // 検索結果表示
            var resultStats = this.getResultStats();
            resultStats.text(this.createResultStatsText(pageNumber, datas.length));
            resultStats.show();

            // if (!countData) { return; }
            // if (countData <= 0) { return; }

            var startTag = this._startTag;
            var endTag = this._endTag;
            var listCols = this._listCols;
            var cntRow = 0;
            var htmlRow = [];
            // データ数分row作成
            $.each(datas, function (indexData, data) {
                if (cntRow > this._itemsOnPage) {
                    return false;
                }
                var startTagTemp = startTag.replace("\$id\$", $.fn.getStringValue(data, "id", ""));
                //alert(JSON.stringify(data));
                var tempRow = [];
                var cntCol = 0;

                // 1行分のcell作成
                $.each(listCols, function (key, outerHtml) {
                    var fieldIds = key.split('__');
                    var temp = outerHtml;
                    var value = '';

                    $.each(fieldIds, function (index, fieldId) {
                        var splittedField = fieldId.split('|');
                        var transformer = splittedField[1];
                        var transformType;
                        var arguments = [];

                        if (typeof transformer === 'string' && transformer.length > 0) {
                            fieldId = splittedField[0];

                            transformType = transformer.split(':', 2)[0];
                            if (transformer.length > transformType.length) {
                                arguments = [transformer.slice(transformType.length + 1)];
                            }
                        } else {
                            fieldId = splittedField[0];
                        }
                        console.log('transforming...', fieldId, transformType, arguments);

                        value = $.fn.getStringValue(data, fieldId, '');

                        switch (transformType) {
                            case 'parseDateTime':
                                if (value) {
                                    value = moment(value)
                                        .tz('Asia/Tokyo')
                                        .format('YY-MM-DD HH:mm:ss');
                                }

                                break;

                            case 'date':
                                if (value) {
                                    var dateObject = moment(value)
                                        .tz('Asia/Tokyo');
                                    value = dateObject.format.apply(dateObject, arguments);
                                }

                                break;

                            case 'duration':
                                if (value) {
                                    var dateObject = moment.duration(value);
                                    if (arguments.length > 0) {
                                        value = dateObject.as.apply(dateObject, arguments) + ' ' + arguments[0] + 's';
                                    } else {
                                        value = dateObject.humanize();
                                    }
                                }

                                break;

                            case 'slice':
                                if (arguments.length === 0) {
                                    arguments = [0, 20];
                                } else {
                                    arguments = [0, arguments[0]];
                                }

                                var sliced = value.slice.apply(value, arguments);
                                if (sliced.length < value.length) {
                                    value = sliced + '...';
                                } else {
                                    value = sliced;
                                }

                                break;

                            default:
                                break;
                        }

                        temp = temp.replace("\$" + fieldId + "\$", value);
                    });
                    tempRow[cntCol++] = temp;
                });
                htmlRow[cntRow] = startTagTemp + tempRow.join("") + endTag;
                cntRow++;
            });

            var listBody = this.getListBody();
            listBody.html(htmlRow.join(''));

            // ページャアイテム数・現在ぺージ再セット
            pager.pagination('updateItems', countData);
            pager.pagination('drawPage', pageNumber);
            pager.show();
            return true;
        },
        dummy: function () {
            alert("dummy");
        },

        /**
         * 現在表示中のデータリストを取得する
         */
        getDatas: function () {
            return this._datas;
        },

        /**
         * 検索結果文字列を作成する
         */
        createResultStatsText: function (page, countFileterd) {
            var text = page + 'ページ目を表示しています';

            if (page <= 1 && countFileterd <= 0) {
                text = 'マッチするデータが見つかりませんでした';
            }

            return text;
        }
    }
});
