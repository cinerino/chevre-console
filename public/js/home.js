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
    updateHealth(function () {
    });

    updateDbStats(function () {
    });

    updateReservationCount(function () {
    });

    updateQueueCount(function () {
    });

    updateLatestReservations(function () {
    });

    updateEventsWithAggregation(function () {
    });
}

function updateReservationCount(cb) {
    $.getJSON(
        '/home/reservationCount',
        {}
    ).done(function (data) {
        console.log('reservationCount:', data);
        $('.reservationCount').removeClass('text-danger').text(data.totalCount);

        cb();
    }).fail(function (jqXHR, textStatus, error) {
        console.error('本日の予約数を検索できませんでした', jqXHR);
        $('.reservationCount').addClass('text-danger').text(textStatus);
    });
}

function updateHealth(cb) {
    $.getJSON(
        '/home/health',
        {}
    ).done(function (data) {
        console.log('health:', data);
        $('.health').removeClass('text-danger').text(data.status);
        $('.version').text(data.version);

        cb();
    }).fail(function (jqXHR, textStatus, error) {
        console.error('ヘルス情報を検索できませんでした', jqXHR);
        $('.health').addClass('text-danger').text(textStatus);
    });
}

function updateDbStats(cb) {
    var GB = 1000000000;
    $.getJSON(
        '/home/dbStats',
        {}
    ).done(function (data) {
        console.log('stats:', data);
        var usedSpaceStr = Math.floor(Number(data.fsUsedSize) / GB)
            + '/'
            + Math.floor(Number(data.fsTotalSize) / GB);
        var dbText = data.db + ' has ' + data.objects + ' objects';

        $('.usedSpace').removeClass('text-danger').text(usedSpaceStr);
        $('.dbText').text(dbText);

        cb();
    }).fail(function (jqXHR, textStatus, error) {
        console.error('DB統計を検索できませんでした', jqXHR);
        $('.usedSpace').addClass('text-danger').text(textStatus);
    });
}

function updateQueueCount(cb) {
    $.getJSON(
        '/home/queueCount',
        {}
    ).done(function (data) {
        console.log('QueueCount:', data);
        $('.queueCount').removeClass('text-danger').text(data.totalCount);

        cb();
    }).fail(function (jqXHR, textStatus, error) {
        console.error('キューを検索できませんでした', jqXHR);
        $('.queueCount').addClass('text-danger').text(textStatus);
    });
}

function updateLatestReservations(cb) {
    $.getJSON(
        '/home/latestReservations',
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
                + '<td>' + reservation.reservationFor.name.ja.slice(0, 5) + '...</td>'
                + '<td><span class="badge badge-secondary">' + reservation.reservationStatus + '</span></td>';
            $('<tr>').html(html)
                .appendTo('#latestReservations tbody');
        });

        cb();
    }).fail(function (jqXHR, textStatus, error) {
        console.error('予約を検索できませんでした', jqXHR);
        $('<p>').addClass('display-4 text-danger')
            .text(textStatus)
            .appendTo('#latestReservations tbody');
    });
}

function updateEventsWithAggregation(cb) {
    $.getJSON(
        '/home/eventsWithAggregations',
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
                + '<td>' + event.name.ja.slice(0, 5) + '...</td>'
                + '<td>' + event.superEvent.location.name.ja + '</td>'
                // + '<td>' + event.startDate + '</td>'
                // + '<td>' + event.saleTicketCount + '</td>'
                // + '<td>' + event.preSaleTicketCount + '</td>'
                // + '<td>' + event.freeTicketCount + '</td>'
                + '<td>' + event.checkInCount + '</td>'
                + '<td>' + event.attendeeCount + '</td>';
            $('<tr>').html(html).appendTo('.eventsWithAggregation tbody');
        });

        cb();
    }).fail(function (jqXHR, textStatus, error) {
        console.error('イベント集計を検索できませんでした', jqXHR);
        $('<p>').addClass('display-4 text-danger')
            .text(textStatus)
            .appendTo('.eventsWithAggregation tbody');
    });
}