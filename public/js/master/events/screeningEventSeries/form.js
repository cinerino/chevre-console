$(function () {
    var eventId = $('input[name="id"]').val();
    var movieOptions = [];
    var selectedMovie;

    // デフォルト選択済作品
    var movieJson = $('textarea[name="movie"]').val();
    if (typeof movieJson === 'string') {
        selectedMovie = JSON.parse(movieJson);
        console.log('movie selected', selectedMovie);
    }

    $('.btn-ok').on('click', function () {
        if (selectedMovie === undefined) {
            alert('作品を選択してください');

            return;
        }

        // 作品の興行終了予定日と上映終了日を比較
        // var movieAvailabilityEnds = $('#workPerformed\\[identifier\\] option:selected').attr('data-availabilityEnds');
        var movieAvailabilityEnds = selectedMovie.offers.availabilityEnds;
        var endDateValue = $('#endDate').val();
        if (movieAvailabilityEnds !== '' && endDate !== '') {
            var endDate = moment(`${endDateValue}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate();
            if (endDate > moment(movieAvailabilityEnds).toDate()) {
                alert('上映終了日は作品の興行終了予定日以前としてください');

                return false;
            }
        }

        // 新規追加の場合スケジュール存在確認なし
        if (eventId === undefined) {
            submit();

            return;
        }

        // 登録済スケジュールの存在を確認        
        $.ajax({
            dataType: 'json',
            url: '/events/screeningEventSeries/' + eventId + '/screeningEvents',
            cache: false,
            type: 'GET',
            data: {
                // 件数を確認したいだけなので1件で十分
                limit: 1
            }
        }).done(function (data) {
            var confirmed = false;
            if (data.totalCount > 0) {
                if (window.confirm('登録済スケジュールが' + data.totalCount + '件存在します。本当に変更しますか？')) {
                    confirmed = true;
                }
            } else {
                confirmed = true;
            }

            if (confirmed) {
                submit();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert('スケジュールを検索できませんでした');
        }).always(function () {
        });
    });

    /**
     * フォームをsubmitする
     */
    function submit() {
        // サイネージ表示名自動保管
        var signageDisplayName = $('#signageDisplayName').val();
        if (signageDisplayName == null || signageDisplayName == '') {
            var movieIdentifier = $('#workPerformed\\[identifier\\] option:selected').val();
            var movieName = $('#workPerformed\\[identifier\\] option:selected').attr('data-name');
            if (movieIdentifier !== '') {
                $('#signageDisplayName').val(movieName);
            }
        }

        $('form').submit();
    }

    var movieSelection = $('#workPerformed\\[identifier\\]');
    movieSelection.select2({
        width: 'resolve', // need to override the changed default
        // containerCss: {
        //     'margin': '.4375rem 0'
        // },
        // containerCssClass: 'form-control',
        // theme: 'default form-control',
        ajax: {
            url: '/events/screeningEventSeries/searchMovies',
            dataType: 'json',
            delay: 250, // wait 250 milliseconds before triggering the request
            // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
            processResults: function (data) {
                movieOptions = data.data;

                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                    results: data.data.map(function (movie) {
                        return {
                            id: movie.identifier,
                            text: movie.name
                        }
                    })
                };
            }
        }
    });

    // 作品選択イベント
    movieSelection.on('select2:select', function (e) {
        onMovieChanged(e.params.data.id);
    });

    $('body').on('change', '#workPerformed\\[identifier\\]', function () {
    });

    /**
     * 作品変更時
     */
    function onMovieChanged(identifier) {
        // var identifier = $(this).val();
        // var identifier = $('#workPerformed\\[identifier\\]').val();
        if (identifier == undefined) {
            return false;
        } else {
            selectedMovie = movieOptions.find(function (m) {
                return m.identifier === identifier;
            });
            console.log('movie selected', selectedMovie);

            // 作品情報を自動補完
            // var movieName = $('#workPerformed\\[identifier\\] option:selected').attr('data-name');
            // var movieHeadline = $('#workPerformed\\[identifier\\] option:selected').attr('data-headline');
            var movieName = selectedMovie.name;
            var movieHeadline = selectedMovie.headline;
            $('#nameJa').val(movieName);
            $('#headline\\[ja\\]').val(movieHeadline);

            // レイティングを自動セット
            console.log('rating is', selectedMovie.contentRating);
            $('#contentRating').val(selectedMovie.contentRating);
        }
    }

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })
});