$(function () {
    var eventId = $('input[name=event]').val();

    $('#seatNumbers').select2({
        // width: 'resolve', // need to override the changed default,
        placeholder: '座席選択',
        allowClear: true,
        ajax: {
            url: '/events/screeningEvent/' + eventId + '/availableSeatOffers',
            dataType: 'json',
            data: function (params) {
                var seatSection = $('select[name=seatSection]').val();

                var query = {
                    seatSection: seatSection,
                    branchCode: {
                        $eq: params.term
                    }
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
                    results: data.map(function (seat) {
                        var disabled = true;
                        if (Array.isArray(seat.offers) && seat.offers.length > 0 && seat.offers[0].availability === 'InStock') {
                            disabled = false;
                        }

                        return {
                            id: seat.branchCode,
                            text: seat.containedInPlace.branchCode + ' ' + seat.branchCode,
                            disabled: disabled
                        }
                    })
                };
            }
        }
    });
});
