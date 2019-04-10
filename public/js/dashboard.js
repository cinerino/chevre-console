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
    updateEventsWithAggregation(function () {
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