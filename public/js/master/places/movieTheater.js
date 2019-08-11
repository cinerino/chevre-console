$(function () {
    JSONEditor.defaults.options.theme = 'bootstrap4';
    JSONEditor.defaults.options.iconlib = 'materialicons';
    initScreen();
    initOffer();
});

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
                                title: 'containsPlace',
                                uniqueItems: true,
                                items: {
                                    type: 'object',
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