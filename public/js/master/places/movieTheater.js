var placeId = '';

$(function () {
    placeId = $('input[name="id"]').val();

    $('.btn-ok').on('click', function () {
        $('.json-editor').remove();

        $(this).addClass('disabled')
            .text('processing...');
        $('form').submit();
    });
    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })

    JSONEditor.defaults.options.theme = 'bootstrap4';
    JSONEditor.defaults.options.iconlib = 'materialicons';

    // JSONエディタをいったん無効化
    // initScreen();
    // initOffer();

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
            url: '/places/movieTheater/' + placeId,
            type: 'DELETE'
        })
            .done(function () {
                alert('削除しました');
                location.href = '/places/movieTheater';
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

/**
 * スクリーンエディタ初期化
 */
function initScreen() {
    var schema = {
        type: 'array',
        uniqueItems: true,
        format: 'tabs',
        items: {
            type: 'object',
            title: 'screen',
            properties: {
                branchCode: { type: 'string' },
                name: {
                    type: 'object',
                    format: "grid",
                    properties: {
                        ja: { type: 'string' },
                        en: { type: 'string' }
                    }
                },
                typeOf: { type: 'string', default: 'ScreeningRoom' },
                containsPlace: {
                    type: 'array',
                    title: 'containsPlace',
                    uniqueItems: true,
                    items: {
                        type: 'object',
                        properties: {
                            branchCode: { type: 'string' },
                            name: {
                                type: 'object',
                                format: "grid",
                                properties: {
                                    ja: { type: 'string' },
                                    en: { type: 'string' }
                                }
                            },
                            typeOf: { type: 'string', default: 'ScreeningRoomSection' },
                            containsPlace: {
                                type: 'array',
                                format: 'table',
                                uniqueItems: true,
                                format: 'tabs',
                                items: {
                                    title: '',
                                    type: 'object',
                                    format: "grid",
                                    properties: {
                                        branchCode: { type: 'string' },
                                        typeOf: { type: 'string', default: 'Seat' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    var options = {
        disable_array_reorder: true,
        schema: schema
    };
    var editor = new JSONEditor(document.getElementById('containsPlaceStr'), options);
    var value = $('textarea[name=containsPlaceStr]').val();
    editor.setValue(JSON.parse(value));
    editor.off('change');
    editor.on('change', function () {
        var value = editor.getValue();
        $('textarea[name=containsPlaceStr]').val(JSON.stringify(value));
    });
}

/**
 * オファーエディタ初期化
 */
function initOffer() {
    var schema = {
        type: 'object',
        properties: {
            typeOf: { type: 'string' },
            eligibleQuantity: {
                type: 'object',
                format: "grid",
                properties: {
                    typeOf: { type: 'string' },
                    maxValue: { type: 'integer' },
                    unitCode: { type: 'string' }
                }
            },
            availabilityStartsGraceTime: {
                type: 'object',
                format: "grid",
                properties: {
                    typeOf: { type: 'string' },
                    value: { type: 'integer' },
                    unitCode: { type: 'string' }
                }
            },
            availabilityEndsGraceTime: {
                type: 'object',
                format: "grid",
                properties: {
                    typeOf: { type: 'string' },
                    value: { type: 'integer' },
                    unitCode: { type: 'string' }
                }
            }
        }
    };
    var options = {
        disable_array_reorder: true,
        schema: schema
    };
    var editor = new JSONEditor(document.getElementById('offersStr'), options);
    var value = $('textarea[name=offersStr]').val();
    editor.setValue(JSON.parse(value));
    editor.off('change');
    editor.on('change', function () {
        var value = editor.getValue();
        $('textarea[name=offersStr]').val(JSON.stringify(value));
    });
}