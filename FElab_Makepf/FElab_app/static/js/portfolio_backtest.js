$(document).ready(function () {
    var stocknames = [];
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
    if (localStorage.getItem('mystocks_weights')!=null){
        mystocks = localStorage.getItem("mystocks").split(',');
        mystocks_weights = localStorage.getItem("mystocks_weights").split(',');
        my_from = localStorage.getItem("from");
        my_to = localStorage.getItem("to");
        for(i=0; i<mystocks.length;i++){
            stocknames.splice(stocknames.indexOf(mystocks[i]),1);
        }
        for (i = 0; i < mystocks.length; i++) {
            $('#asset_row').append("<tr eq= "+i+"><td class='numberCell'>"+mystocks[i]+
            "</td><td class='numberCell'><input id='assetweight"+i+"' class='input_weight' type='text' style='text-align:right;width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value="+Number(mystocks_weights[i]).toFixed(2)*100+
            ">%</td><td class='numberCell'><button id='putout_btn'  eq= "+i+" name=" + mystocks[i] +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
        }
        $('#from').val(my_from);
        $('#to').val(my_to);
        pie_backgroundColor = ['#003f5c', '#2f4b7c','#665191','#a05195', '#d45087', '#f95d6a','#ff7c43','#ffa600'];
        data = {
            datasets: [{
                data: mystocks_weights,
                backgroundColor:pie_backgroundColor.slice(0,mystocks.length),
            }],
            labels : mystocks, 
        }
        Draw_optimize_pie(data);
    }else{
        $('chartdiv').empty();
    }
    
    $("#putin_btn").click(function () {
        if (stocknames.includes($('#comboBox').val())) {
            mystocks.push($('#comboBox').val());
            stocknames.splice(stocknames.indexOf($('#comboBox').val()),1);
            $('#asset_row').append("<tr><td class='numberCell'>"+$('#comboBox').val()+
            "</td><td class='numberCell'><input id='assetweight"+i+"' class='input_weight' type='text' style='text-align:right;width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value=>%</td><td class='numberCell'><button id='putout_btn'  eq= "+$('#asset_row')[0].rows.length+" name=" + $('#comboBox').val() +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
            $('#comboBox').val("");
        } else {
            alert("종목 정보가 올바르지 않습니다");
        }
    });
    $(document).on('click', '#putout_btn', function () {
        $('#asset_row tr').eq($(this).attr('eq')).remove();
        mystocks.splice(mystocks.indexOf($(this).attr('name')),1);
        
        stocknames.push($(this).attr('name'));
    });
    $(document).on('change', '.input_weight',function(){
        sum = 0
        mystocks_weights=[];
        for(i=0;i<mystocks.length;i++){
            sum = sum+$('#assetweight'+i).val()/100
            mystocks_weights.push($('#assetweight'+i).val()/100);
        }
        if(sum!=1){
        }else{
            window.opt_report_chart.destroy();
            data = {
                datasets: [{
                    data: mystocks_weights,
                    backgroundColor:pie_backgroundColor.slice(0,mystocks.length),
                }],
                labels : mystocks, 
            }
            Draw_optimize_pie(data);
        }
    });
    var dateFormat = "mm/dd/yy",
    from = $("#from")
        .datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            changeYear: true,
            numberOfMonths: 1
        })
        .on("change", function () {
            to.datepicker("option", "minDate", getDate(this));
        }),
        to = $("#to").datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            changeYear: true,
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
        sum = 0
        mystocks_weights=[];
        for(i=0;i<mystocks.length;i++){
            sum = sum+$('#assetweight'+i).val()/100
            mystocks_weights.push($('#assetweight'+i).val()/100);
        }
        if(sum!=1){
            alert("비중의 합이 1이 아닙니다.");
        }else{
            $.ajax({
                url: '/ajax_backtest/',
                type: "POST",
                dataType: "json",
                //
                //,
                data : {"assetsBox[]" : mystocks, "assetweights[]" : mystocks_weights, "from" : $('#from').val(), 'to' : $('#to').val(),
            'rebalancing_month' : $('#rebalancing_month').val(), 'start_amount' : $('#start_amount').val(), 'strategy': $('input[name=strategy]:checked').val()},
                success: function (data) {
                    console.log(data.indicator);
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
                    KOSPI_return = data.bench[0]['KOSPI_return'];
                    SP500_return = data.bench[0]['S&P500_return'];
                    KOSPI_balance = data.bench[0]['KOSPI_balance'];
                    SP500_balance = data.bench[0]['S&P500_balance'];
                    KOSPI_drawdown = data.bench[0]['KOSPI_Drawdown'];
                    SP500_drawdown = data.bench[0]['S&P500_Drawdown'];
                    

                    $('#daterange').html(" " + $('#from').val() +"~"+ $('#to').val());
                    //그래프 그리기
                    Draw_value_chart(back_Date, back_value,KOSPI_balance, SP500_balance);
                    Draw_Return_chart(back_Date, back_return,KOSPI_return, SP500_return);
                    Draw_MDD_chart(back_Date, back_Drawdown,KOSPI_drawdown,SP500_drawdown);
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
    }
    });
    

});
function Draw_optimize_pie(data){
    var ctx_opt_weight = document.getElementById("opt_report_chart").getContext('2d');
    window.opt_report_chart = new Chart(ctx_opt_weight, {
        type: 'pie',
        data : data,
        option : {
            responsive: false,
            legend : true,
            maintainAspectRatio : false,
            animation: true,
            pieceLabel:{
                mode: 'label',
                potision: 'outside',
                fontsize: 15,
            }
        }
    });

}

function Draw_value_chart(x, y,y_kospi, y_SP) {
    var value_ctx = document.getElementById("value_chart").getContext('2d');
    window.value_chart = new Chart(value_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 가치 변화',
                data: y,
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '벤치마크 : 코스피',
                data: y_kospi,
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '벤치마크 : S&P500',
                data: y_SP,
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            }],
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
function Draw_Return_chart(x, y, y_kospi, y_SP) {
    var return_ctx = document.getElementById("Return_chart").getContext('2d');
    window.value_chart = new Chart(return_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 수익률 변화',
                data: y,
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '벤치마크 : 코스피',
                data: y_kospi,
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '벤치마크 : S&P500',
                data: y_SP,
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                pointRadius: 1,
                pointHoverRadius: 1,
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
function Draw_MDD_chart(x, y, y_kospi,y_SP) {
    var MDD_ctx = document.getElementById("MDD_chart").getContext('2d');
    window.value_chart = new Chart(MDD_ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: '포트폴리오 MDD',
                data: y,
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '벤치마크 : 코스피',
                data: y_kospi,
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '벤치마크 : S&P500',
                data: y_SP,
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                pointRadius: 1,
                pointHoverRadius: 1,
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
