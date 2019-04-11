/*
 * ダッシュボードを表現するためのjs
 **/
var PROJECT_ID = $('input[name="projectId"]').val();

var orders = [];
var searchedAllOrders = false;
var limit = 10;
var page = 0;

$(function () {
    // SLIMSCROLL FOR CHAT WIDGET
    // $('#chat-box').slimScroll({
    //     height: '250px'
    // })

    // Fix for charts under tabs
    $('.box ul.nav a').on('shown.bs.tab', function () {
        // area.redraw()
        // donut.redraw()
        // line.redraw()
    })

    updateCharts();
    setInterval(
        function () {
            updateCharts();
        },
        60000
    );
});

function updateCharts() {
    // countNewOrder(function () {
    // });
    // aggregateExitRate(function () {
    // });
    // countNewUser(function () {
    // });
    // countNewTransaction(function () {
    // });
    updateLatestReservations(function () {
    });

    updateEventsWithAggregation(function () {
    });
}

function updateLatestReservations(cb) {
    $.getJSON(
        '/dashboard/latestReservations',
        {
            limit: 10,
            page: 1,
            // sort: { orderDate: -1 },
            // orderDateFrom: moment().add(-1, 'day').toISOString(),
            // orderDateThrough: moment().toISOString()
        }
    ).done(function (data) {
        $('#latestReservations tbody').empty();

        // $('.eventsCount').text(data.totalCount);

        $.each(data.data, function (_, reservation) {
            var html = '<td>' + reservation.reservationNumber + '</td>'
                + '<td>' + moment(reservation.modifiedTime).format('MM/DD HH:mm') + '</td>'
                + '<td>' + reservation.reservationFor.name.ja + '</td>'
                + '<td><span class="badge badge-secondary">' + reservation.reservationStatus + '</span></td>';
            $('<tr>').html(html).appendTo('#latestReservations tbody');
        });

        cb();
    }).fail(function () {
        console.error('予約を検索できませんでした')
    });
}

function updateEventsWithAggregation(cb) {
    $.getJSON(
        '/dashboard/eventsWithAggregations',
        {
            limit: 10,
            page: 1,
            sort: { orderDate: -1 },
            orderDateFrom: moment().add(-1, 'day').toISOString(),
            orderDateThrough: moment().toISOString()
        }
    ).done(function (data) {
        $('.eventsWithAggregation tbody').empty();

        $('.eventsCount').text(data.totalCount);

        $.each(data.data, function (_, event) {
            var html = '<td>' + moment(event.startDate).format('MM/DD HH:mm') + '</td>'
                + '<td>' + event.name.ja + '</td>'
                // + '<td>' + event.startDate + '</td>'
                + '<td>' + event.saleTicketCount + '</td>'
                + '<td>' + event.preSaleTicketCount + '</td>'
                + '<td>' + event.freeTicketCount + '</td>'
                + '<td>' + event.checkInCount + '</td>'
                + '<td>' + event.attendeeCount + '</td>';
            $('<tr>').html(html).appendTo('.eventsWithAggregation tbody');
        });

        cb();
    }).fail(function () {
        console.error('イベント集計を検索できませんでした')
    });
}