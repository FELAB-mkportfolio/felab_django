$(document).ready(function () {
    assetsBox = [];
    var chartdiv = document.querySelector('#opt_report_chart');
    var charttype = am4charts.PieChart;
    var stocknames = [];
    if (localStorage.getItem('assets_weight')!=null){
        jparse = JSON.parse(localStorage.getItem("assets_weight"))
        obj = Object.keys(jparse);
        for(i=0; i<obj.length;i++){
            stocknames.splice(stocknames.indexOf(obj[i]),1);
            assetsBox.push(obj[i]);
        }
        for (i = 0; i < assetsBox.length; i++) {
            $('#asset_row').append("<tr><td class='numberCell'>"+assetsBox[i]+
            "</td><td class='numberCell'><input id='assetweight"+i+"' class='input_weight' type='text' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value="+jparse[assetsBox[i]]+
            "></td><td class='numberCell'><button id='putout_btn' name=" + assetsBox[i] +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
        }
        var chart = createChart(chartdiv, charttype);
        DrawChart(chart, assetsBox);
    }else{
        $('chartdiv').empty();
    }
    
    $.ajax({
        url: '/ajax_db_return/',
        type: "POST",
        dataType: "json",
        success: function (data) {
            for (var i = 0; i < data.length; i++) {
                stocknames.push(data[i][0]);
            }
        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
    $('#comboBox').autocomplete({
        source: stocknames,
        select: function (event, ui) {
        },
        focus : function(event, ui){
            return false;
        },
        minLength : 1,
        autoFocus : true,
        classes : {
            'ui-autocomplete' : 'highlight'
        },
        delay : 500,
        disable : false,
        position : {my : 'right top', at: 'right bottom'},
    });
    $("#putin_btn").click(function () {
        if (stocknames.includes($('#comboBox').val())) {
            assetsBox.push($('#comboBox').val());
            stocknames.splice(stocknames.indexOf($('#comboBox').val()),1);
            $('#asset_row').empty();
            $('#comboBox').val("");
            for (i = 0; i < assetsBox.length; i++) {
                $('#asset_row').append("<tr><td class='numberCell'>"+assetsBox[i]+
            "</td><td class='numberCell'><input id='assetweight"+i+"' class='input_weight' type='text' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value=''"+
            "></td><td class='numberCell'><button id='putout_btn' name=" + assetsBox[i] +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
            }
        } else {
            alert("종목 정보가 올바르지 않습니다");
        }
    });
    $(document).on('click', '#putout_btn', function () {
        $('#asset_row').empty();
        assetsBox.splice(assetsBox.indexOf($(this).attr('name')),1);
        for (i = 0; i < assetsBox.length; i++) {
            $('#asset_row').append("<tr><td class='numberCell'>"+assetsBox[i]+
            "</td><td class='numberCell'><input id='assetweight"+i+"' class='input_weight' type='text' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value="+jparse[assetsBox[i]]+
            "></td><td class='numberCell'><button id='putout_btn' name=" + assetsBox[i] +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
        }
        stocknames.push($(this).attr('name'));
    });
    $(document).on('change', '.input_weight',function(){
        var chart = createChart(chartdiv, charttype);
        DrawChart_change(chart, assetsBox);
    });
    var dateFormat = "mm/dd/yy",
    from = $("#from")
        .datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 1
        })
        .on("change", function () {
            to.datepicker("option", "minDate", getDate(this));
        }),
        to = $("#to").datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 1
        })
            .on("change", function () {
                from.datepicker("option", "maxDate", getDate(this));
            });
    function getDate(element) {
        var date;
        try {
            date = $.datepicker.parseDate(dateFormat, element.value);
        } catch (error) {
            date = null;
        }

        return date;
    }
    
    $('#backtest_btn').click(function() {
        assetweights = [];
        for(i=0;i<assetsBox.length;i++){
            assetweights.push(parseFloat($('#assetweight'+i).val()));
        }
        $.ajax({
            url: '/ajax_backtest/',
            type: "POST",
            dataType: "json",
            //
            //,
            data : {"assetsBox[]" : assetsBox, "assetweights[]" : assetweights, "from" : $('#from').val(), 'to' : $('#to').val(),
        'rebalancing_month' : $('#rebalancing_month').val(), 'start_amount' : $('#start_amount').val(), 'strategy': $('input[name=strategy]:checked').val()},
            success: function (data) {
                back_Mean = data.indicator[0]['Mean'];
                back_Std = data.indicator[0]['Std'];
                back_Sharp_ratio = data.indicator[0]['Sharpe ratio'];
                back_VaR = data.indicator[0]['VaR'];
                back_MDD = data.indicator[0]['MDD'];
                back_Gain_loss = data.indicator[0]['Gain/Loss Ratio'];
                back_Winnig_ratio = data.indicator[0]['Winning Ratio'];
                back_Date = data.pfo_return[0]['Date'];
                back_Drawdown = data.pfo_return[0]['Drawdown_list'];
                back_acc = data.pfo_return[0]['acc_return ratio'];
                back_value = data.pfo_return[0]['final_balance'];
                back_return = data.pfo_return[0]['mean_return'];

                $('#daterange').html(" " + $('#from').val() +"~"+ $('#to').val());
                //그래프 그리기
                Draw_value_chart(back_Date, back_value);
                Draw_Return_chart(back_Date, back_return);
                Draw_MDD_chart(back_Date, back_Drawdown);
                Draw_acc_chart(back_Date, back_acc);
                $('#mean_return').html(back_Mean.toFixed(2));
                $('#std').html(back_Std.toFixed(2));
                $('#sharp').html(back_Sharp_ratio.toFixed(2));
                $('#VaR').html(back_VaR.toFixed(2));
                $('#MDD').html(back_MDD.toFixed(2));

                $('#result_container').css('display','block');
            },
            error: function (request, status, error) {
                console.log('실패');
            }
        });
    });

});
var chartReg = {};

function createChart(chartdiv, charttype) {
    // Check if the chart instance exists
    maybeDisposeChart(chartdiv);
    // Create new chart
    chartReg[chartdiv] = am4core.create(chartdiv, charttype);
    return chartReg[chartdiv];
}
function maybeDisposeChart(chartdiv){
    if (chartReg[chartdiv]) {
        chartReg[chartdiv].dispose();
        delete chartReg[chartdiv];
    }
}
function DrawChart(chart, assetsBox){
    for(i=0;i<assetsBox.length;i++){
        chart.data.push({ "Asset" : obj[i], "Weight" : jparse[obj[i]]});
    }
    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "Weight";
    pieSeries.dataFields.category = "Asset";
}
function DrawChart_change(chart, assetsBox){
    var sum = 0
    for (i=0;i<assetsBox.length;i++){
        sum = sum+ parseFloat($('#assetweight'+i).val());
    }
    if (sum == 1){
        for(i=0;i<assetsBox.length;i++){
            chart.data.push({ "Asset" : assetsBox[i], "Weight" : $('#assetweight'+i).val()});
        }
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "Weight";
        pieSeries.dataFields.category = "Asset";
    }else{
        chart.dispose();
        $('#opt_report_chart').empty();
    }

}
function Draw_value_chart(x, y) {
    var value_ctx = document.getElementById("value_chart").getContext('2d');
    window.value_chart = new Chart(value_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 가치 변화',
                data: y,
                borderColor: "rgba(255, 201, 14, 1)",
                backgroundColor: "rgba(255, 201, 14, 0.5)",
                fill: true,
                lineTension: 0
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: '기간'
                    }
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 0,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '가치'
                    }
                }]
            }
        }
    });

}
function Draw_Return_chart(x, y) {
    var return_ctx = document.getElementById("Return_chart").getContext('2d');
    window.value_chart = new Chart(return_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 수익률 변화',
                data: y,
                borderColor: "rgba(255, 201, 14, 1)",
                backgroundColor: "rgba(255, 201, 14, 0.5)",
                lineTension: 0,
                fill: false,
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: '기간'
                    }
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 0,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '수익률'
                    }
                }]
            }
        }
    });
}
function Draw_MDD_chart(x, y) {
    var MDD_ctx = document.getElementById("MDD_chart").getContext('2d');
    window.value_chart = new Chart(MDD_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 MDD',
                data: y,
                borderColor: "rgba(255, 201, 14, 1)",
                backgroundColor: "rgba(255, 201, 14, 0.5)",
                lineTension: 0
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: '기간'
                    }
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 0,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '수익률'
                    }
                }]
            }
        }
    });
}
function Draw_hist_chart(x, y) {
    var return_ctx = document.getElementById("Histogram_chart").getContext('2d');
    window.value_chart = new Chart(return_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 수익률 변화',
                data: y,
                borderColor: "rgba(255, 201, 14, 1)",
                backgroundColor: "rgba(255, 201, 14, 0.5)",
                lineTension: 0
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: '기간'
                    }
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 0,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '수익률'
                    }
                }]
            }
        }
    });
}
function Draw_acc_chart(x, y) {
    var acc_ctx = document.getElementById("acc_chart").getContext('2d');
    window.value_chart = new Chart(acc_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 누적 이익률',
                data: y,
                borderColor: "rgba(255, 201, 14, 1)",
                backgroundColor: "rgba(255, 201, 14, 0.5)",
                lineTension: 0
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: '기간'
                    }
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 0,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '이익률'
                    }
                }]
            }
        }
    });
}
