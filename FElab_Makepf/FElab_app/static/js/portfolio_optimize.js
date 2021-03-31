var assetsBox = []
var stocknames = [];
var mystocksDB = [];
var mystocks = [];
$(document).ready(function () {
    
    $.ajax({
        url: '/ajax_db_return/',
        type: "POST",
        dataType: "json",
        success: function (data) {
            for (var i = 0; i < data.length; i++) {
                stocknames.push(data[i][0]);
                mystocksDB.push(data[i][0]);
            }
            if(localStorage.getItem("assets_weight")!=null){
                jparse = JSON.parse(localStorage.getItem("assets_weight"))
                obj = Object.keys(jparse);
                for(i=0; i<obj.length;i++){
                    stocknames.splice(stocknames.indexOf(obj[i]),1);
                    assetsBox.push(obj[i]);
                }
                for (i = 0; i < assetsBox.length; i++) {
                $('#assetsBox').append("<div style='position:relative;margin: 10px 0;width:100%;height:30px;display:flex;justify-content:center;border-bottom:1px solid #eeeeee;'><p>"
                            + assetsBox[i] + "</p > <button id='putout_btn' name=" + assetsBox[i] +
                            " style='position:absolute;right:5px;;width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></div>");
                }
            }

        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
    $('#comboBox').autocomplete({
        source: stocknames,
        select: function (event, ui) {
            $.ajax({
                url: '/ajax_db_return/',
                type: "POST",
                dataType: "json",
                data: { 'stock_code': ui.item.value },
                success: function (data) {
                    var stockdata = [];
                    for (var i = 0; i < data.length; i++) {
                        stockdata.push({ 'Date': moment(data[i][0]).format('YYYY-MM-DD'), 'Open': data[i][1], 'High': data[i][2], 'Low': data[i][3], 'Close': data[i][4], 'Volume': data[i][5] })
                    }
                    var chartdiv = document.querySelector('#chartdiv');
                    var charttype = am4charts.XYChart;
                    var chart = createChart(chartdiv, charttype);
                    stockGraph(stockdata,chart);
                },
                error: function (request, status, error) {
                    console.log('실패');
                }
            })
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
    $('#my_comboBox').autocomplete({
        source: mystocksDB,
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

   
    $("#my_putin_btn").click(function () {
        if (mystocksDB.includes($('#my_comboBox').val())) {
            mystocks.push($('#my_comboBox').val());
            
            mystocksDB.splice(mystocksDB.indexOf($('#my_comboBox').val()),1);
            $('#asset_row').empty();
            $('#my_comboBox').val("");
            for (i = 0; i < mystocks.length; i++) {
                $('#asset_row').append("<tr><td class='numberCell'>"+mystocks[i]+
            "</td><td class='numberCell'><input id='my_assetweight"+i+"' class='my_input_weight' type='text' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value=''"+
            "></td><td class='numberCell'><button id='my_putout_btn' name=" + mystocks[i] +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
            }
        } else {
            alert("종목 정보가 올바르지 않습니다");
        }
    });
    $("#putin_btn").click(function () {
        if (stocknames.includes($('#comboBox').val())) {
            assetsBox.push($('#comboBox').val());
            
            stocknames.splice(stocknames.indexOf($('#comboBox').val()),1);
            $('#assetsBox').empty();
            $('#comboBox').val("");
            for (i = 0; i < assetsBox.length; i++) {
                $('#assetsBox').append("<div style='position:relative;margin-bottom:5px;width:100%;height:30px;display:flex;justify-content:center;border-bottom:1px solid #eeeeee;'><p>"
                    + assetsBox[i] + "</p > <button id='putout_btn' name=" + assetsBox[i] +
                    " style='position:absolute;right:5px;;width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></div>");
            }
        } else {
            alert("종목 정보가 올바르지 않습니다");
        }
    });

    $(document).on('click', '#putout_btn', function () {
        $('#assetsBox').empty();
        assetsBox.splice(assetsBox.indexOf($(this).attr('name')),1);
        for (i = 0; i < assetsBox.length; i++) {
            $('#assetsBox').append("<div style='position:relative;margin-bottom:5px;width:100%;height:30px;display:flex;justify-content:center;border-bottom:1px solid #eeeeee;'><p>"
                + assetsBox[i] + "</p > <button id='putout_btn' name=" + assetsBox[i] +
                " style='position:absolute;right:5px;;width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></div>");
        }
        stocknames.push($(this).attr('name'));
    });

    $(document).on('click', '#my_putout_btn', function () {
        $('#asset_row').empty();
        mystocks.splice(mystocks.indexOf($(this).attr('name')),1);
        for (i = 0; i < mystocks.length; i++) {
            $('#asset_row').append("<tr><td class='numberCell'>"+mystocks[i]+
            "</td><td class='numberCell'><input id='my_assetweight"+i+"' class='my_input_weight' type='text' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value="+jparse[mystocks[i]]+
            "></td><td class='numberCell'><button id='my_putout_btn' name=" + mystocks[i] +
            " style='width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></td></tr>");
        }
        stocknames.push($(this).attr('name'));
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
    $('#optimize_btn').click(function () {

        if (assetsBox.length == 0) {
            alert("선택된 자산이 없습니다.");
        }else if(assetsBox.length==1){
            alert("한개의 자산으로는 최적화를 진행할 수 없습니다.");
        }
         else {
            $.ajax({
                url: '/ajax_portfolio_optimize_return/',
                type: "POST",
                dataType: "json",
                data: {
                    
                    "assetsBox[]": assetsBox, "from": $('#from').val(), 'to': $('#to').val(),
                    'strategy': $('input[name=strategy]:checked').val()
                },
                success: function (data) {
                    GMV = data.ret_vol['GMV'];
                    MaxSharp = data.ret_vol['MaxSharp'];
                    RiskParity = data.ret_vol['RiskParity'];
                    Trets = data.ret_vol['Trets'];
                    Tvols = data.ret_vol['Tvols'];
                    ef_points = JSON.parse(data.efpoints);
                    ef_points_tooltip = return_dict_items(ef_points);
                    asset_weights = JSON.parse(data.weights);
                    if (asset_weights ==1){
                        alert("입력한 기간이 짧습니다.");
                        location.reload();
                    }
                    if(window.Efchart){
                        window.Efchart.destroy();
                    }
                    var pie_backgroundColor = ['#003f5c', '#2f4b7c','#665191','#a05195', '#d45087', '#f95d6a','#ff7c43','#ffa600'];
                    if($('input[name="strategy"]:checked').val()=='gmv'){
                        $('#strategy_name_h2').html('Global Minimum Variance');
                        $('#strategy_comment_span').html('GMV(전역 최소 분산) 포트폴리오는 투자자의 위험 성향이 아주 강한 경우의 포트폴리오입니다. 이러한 상황에서 투자자는 수익의 최대화보다 위험의 최소화를 우선순위로 두게 되며, 이에 따른 최적화는 가장 낮은 변동성의 포트폴리오를 구성할 수 있도록 가중치의 해를 찾습니다.');
                        data = {
                            datasets: [{
                                data: asset_weights['gmv'],
                                backgroundColor:pie_backgroundColor.slice(0,assetsBox.length),
                            }],
                            labels : assetsBox, 
                        }
                        r_array= round_array(asset_weights['gmv']);
                        Draw_optimize_pie(data);
                        $('#opt_report_table').empty();
                        for (i =0; i<assetsBox.length; i++){
                            $('#opt_report_table').append('<tr><td>'+assetsBox[i]+'</td><td class="numberCell">'+r_array[i]+'%</td></tr>');
                        }
                    }
                    else if($('input[name="strategy"]:checked').val()=='ms'){
                        $('#strategy_name_h2').html('Maximum Sharpe Ratio');
                        $('#strategy_comment_span').html('샤프지수는 감수한 위험 대비 달성 하게 되는 수익은 어느정도나 되는 가를 평가할 때 쓰이는 지수입니다. 즉 위험 자산에 투자함으로써 얻은 초과 수익의 정도를 나타내는 지표입니다. 이러한 샤프 지수를 최대화한 포트폴리오가 Maximum Sharpe Ratio Portfolio 입니다.');
                        data = {
                            datasets: [{
                                data: asset_weights['ms'],
                                backgroundColor:pie_backgroundColor.slice(0,assetsBox.length),

                            }],
                            labels : assetsBox, 
                        }
                        Draw_optimize_pie(data);
                        r_array= round_array(asset_weights['ms']);
                        $('#opt_report_table').empty();
                        for (i =0; i<assetsBox.length; i++){
                            $('#opt_report_table').append('<tr><td>'+assetsBox[i]+'</td><td class="numberCell">'+r_array[i]+'%</td></tr>');
                        }
                    }
                    else if($('input[name="strategy"]:checked').val()=='rp'){
                        $('#strategy_name_h2').html('Risk Parity Portfolio');
                        $('#strategy_comment_span').html('리스크 패리티 전략은 개별자산의 수익률 변동이 포트폴리오 전체 위험에 기여하는 정도를 동일하도록 구성해서 포트폴리오 전체 위험이 특정 자산의 가격 변동에 과도하게 노출되는 것을 피하기 위한 자산배분전략입니다.');
                        data = {
                            datasets: [{
                                data: asset_weights['rp'],
                                backgroundColor:pie_backgroundColor.slice(0,assetsBox.length),
                            }],
                            labels : assetsBox, 
                        }
                        Draw_optimize_pie(data);
                        r_array= round_array(asset_weights['rp']);
                        $('#opt_report_table').empty();
                        for (i =0; i<assetsBox.length; i++){
                            $('#opt_report_table').append('<tr><td>'+assetsBox[i]+'</td><td class="numberCell">'+r_array[i]+'%</td></tr>');
                        }
                    }
                    
                    opt_result(assetsBox, GMV, MaxSharp, RiskParity, Trets, Tvols);

                },
                error: function (request, status, error) {
                    console.log('실패');
                }
            });

        }
    });
    $(document).on('click', '.additional_assets', function () {
        clicked_value = $(this).attr('value');
        clicked_text = $(this).html();
        $("a").remove(`#${clicked_value}`);
        $(".added_assetsBox").append("<a id='"+clicked_value+"' class='added_assets' value='"+clicked_value+"' >"+clicked_text+"</a>");
    });
    $(document).on('click', '.added_assets', function () {
        clicked_value = $(this).attr('value');
        clicked_text = $(this).html();
        $("a").remove(`#${clicked_value}`);
        $(".additional_assetsBox").append("<a id='"+clicked_value+"' class='additional_assets' value='"+clicked_value+"' >"+clicked_text+"</a>");
    });
    $('#add_portfolio').click(function (e) {
        var targeted_popup_class = $(this).attr('data-popup-open'); 
        $('[data-popup="' + targeted_popup_class + '"]').fadeIn(350);
        e.preventDefault();
    });
    $('[data-popup-close]').on('click', function(e) { // 팝업 닫기 버튼 클릭시 동작하는 이벤트입니다. 
        var targeted_popup_class = $(this).attr('data-popup-close'); 
        $('[data-popup="' + targeted_popup_class + '"]').fadeOut(350); 
        e.preventDefault(); 
    });
    $(document).on('propertychange change keyup paste input', '.my_input_weight',function(){
        var sum = 0
        for (i=0;i<mystocks.length;i++){
            sum = sum+ parseFloat($('#my_assetweight'+i).val());
        }
        if(sum!=1){
            $('#save_portfolio_btn').attr("disabled", "disabled");
            $('#save_portfolio_btn').css("background-color","#ccc");
        }else{
            $('#save_portfolio_btn').removeAttr("disabled");
            $('#save_portfolio_btn').css("background-color","#8C0000");
        }
    });
    $('#save_portfolio_btn').click(function(){
        if($('.multiselect-selected-text').html()=='None selected'){
            alert("투자하고 있는 자산을 선택하여 주세요");
        }else if(mystocks.length==0){
            alert("선택된 자산이 없습니다.");
        }else{
            
        }

    });
});

function numtofix(array){
    r_array = []
    for(var i=0;i<array.length;i++){
        r_array.push(array[i].toFixed(2));
    }
    return r_array 
}
function round_array(array){
    r_array = []
    for(var i=0;i<array.length;i++){
        r_array.push(Math.round(array[i]*100));
    }
    return r_array
}
function Draw_optimize_pie(data){
    
    var ctx_opt_weight = document.getElementById("opt_report_chart").getContext('2d');
    window.opt_report_chart = new Chart(ctx_opt_weight, {
        type: 'pie',
        data : data,
        option : {
            responsive: true,
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
function pushscatter(chart, x, y, label, color, order) {
    chart.data.datasets.push({
        type: 'scatter',
        label: label,
        showLine: false,
        data: [{ x: x, y: y }],
        backgroundColor: color,
        pointBackgroundColor: color,
        pointRadius: 8,
        pointHoverRadius: 8,
        order: order,
    });
    window.Efchart.update();
}
function tobacktest() {
    if(assetsBox.length==0){
        alert("아무런 자산을 입력하지 않았습니다.");
    }else{
    asset_json = {};
    for (i = 0; i < assetsBox.length; i++) {
        asset_json[assetsBox[i]] = window.opt_report_chart.data.datasets[0].data[i];
    }
    localStorage.setItem("assets_weight", JSON.stringify(asset_json));

    location.href = '/portfolio_backtest';
    }
}
    
function opt_result(assetsBox, GMV, MaxSharp, RiskParity, Trets, Tvols) {
    
    $('.optimize_result').css('display', 'flex');
    var Ef_ctx = document.getElementById("efficient_frontier_graph").getContext('2d');
    ef_storage = [];
    
    for (var i = 0; i < Trets.length; i++) {
        x = Number(Tvols[i]);
        y = Number(Trets[i]);
        var json = { x: x, y: y };
        ef_storage.push(json);
    }

    window.Efchart = new Chart(Ef_ctx, {
        type: 'scatter',
        data: {
            datasets : [{
                label : '효율적 투자선',
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data : ef_storage,
                showLine : true,
                fill : false,
                order : 1,
            }],
        },
        options: {
            responsive: true, // Instruct chart js to respond nicely.
            maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
            tooltips:{
                displayColors:false,
                titleFontColor:'#fff',
                titleAlign: 'center',
                bodyFontSize: 15,
                bodySpacing: 2,
                bodyFontColor: '#fff',
                bodyAlign: 'center',
                callbacks: {
                    label: function(tooltipitem, data){
                        var title = "기대수익률 : "+ tooltipitem['yLabel'].toFixed(2) + " 표준편차 : "+tooltipitem['xLabel'].toFixed(2);
                        var body = "";
                        for (var i=0; i<assetsBox.length; i++){
                            body= body + assetsBox[i] + ": " + ef_points_tooltip[tooltipitem['index']][i].toFixed(2)*100 + '% \n';
                        }
                        return [title, "", body];
                    }
                }
            }
        },
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Annual Return',
                    fontStyle: 'bold',
                    fontSize: '15',
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Annual Volatility',
                    fontStyle: 'bold',
                    fontSize: '15',
                }
            }]
        },
        tooltips: {
            mode: 'single',
            displayColors: false,
            backgroundColor: '#282721',
            titleFontColor: '#fff',
            titleAlign: 'center',
            bodySpacing: 2,
            bodyFontColor: '#fff',
            bodyAlign: 'center',
            callbacks: {
                title: function (tooltipitem, data) {
                    return data.datasets[tooltipitem[0]['datasetIndex']].label;
                },
                label: function (tooltipitem, data) {
                    var label = "annual_volatility : " + tooltipitem['xLabel'];
                    label += "  annual_return : " + tooltipitem['yLabel'];
                    return label;
                },
                afterLabel: function (tooltipitem, data) {
                    var footer = ' ';
                    if (tooltipitem['datasetIndex'] == 0) {
                        for (var i = 0; i < ind_names.length; i++) {
                            footer += ind_names[i] + " : " + ind_weight[tooltipitem['index']][i] + "%\n";
                        }
                    }
                    return footer;
                }
            }
        }
    });
    pushscatter(Efchart, GMV[0], GMV[1], 'GMV Portfolio', '#536162', '2');
    pushscatter(Efchart, MaxSharp[0], MaxSharp[1], 'Max Sharp Portfolio', '#8C0000', '2');
    pushscatter(Efchart, RiskParity[0], RiskParity[1], 'Risk Parity Portfolio', '#E48257', '2')
}

function return_dict_items(dict){
    var i, arr= [];
    for(i in dict){
        arr.push(dict[i]);
    }
    return arr;
}
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
function stockGraph(stockdata,chart) {
    am4core.ready(function () {
        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        //chart = am4core.create("chartdiv", am4charts.XYChart);

        chart.padding(0, 15, 0, 15);

        // Load data
        chart.data = stockdata;

        // the following line makes value axes to be arranged vertically.
        chart.leftAxesContainer.layout = "vertical";

        // uncomment this line if you want to change order of axes
        //chart.bottomAxesContainer.reverseOrder = true;

        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.grid.template.location = 0;
        dateAxis.renderer.ticks.template.length = 8;
        dateAxis.renderer.ticks.template.strokeOpacity = 0.1;
        dateAxis.renderer.grid.template.disabled = true;
        dateAxis.renderer.ticks.template.disabled = false;
        dateAxis.renderer.ticks.template.strokeOpacity = 0.2;
        dateAxis.renderer.minLabelPosition = 0.01;
        dateAxis.renderer.maxLabelPosition = 0.99;
        dateAxis.keepSelection = true;
        dateAxis.minHeight = 30;

        dateAxis.groupData = true;
        dateAxis.minZoomCount = 5;

        // these two lines makes the axis to be initially zoomed-in
        // dateAxis.start = 0.7;
        // dateAxis.keepSelection = true;

        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.zIndex = 1;
        valueAxis.renderer.baseGrid.disabled = true;
        // height of axis
        valueAxis.height = am4core.percent(65);

        valueAxis.renderer.gridContainer.background.fill = am4core.color("#000000");
        valueAxis.renderer.gridContainer.background.fillOpacity = 0.05;
        valueAxis.renderer.inside = true;
        valueAxis.renderer.labels.template.verticalCenter = "bottom";
        valueAxis.renderer.labels.template.padding(2, 2, 2, 2);

        //valueAxis.renderer.maxLabelPosition = 0.95;
        valueAxis.renderer.fontSize = "0.8em"

        var series = chart.series.push(new am4charts.CandlestickSeries());
        series.dataFields.dateX = "Date";
        series.dataFields.openValueY = "Open";
        series.dataFields.valueY = "Close";
        series.dataFields.lowValueY = "Low";
        series.dataFields.highValueY = "High";
        series.clustered = false;
        series.tooltipText = "open: {openValueY.value}\nlow: {lowValueY.value}\nhigh: {highValueY.value}\nclose: {valueY.value}";
        series.name = "MSFT";
        series.defaultState.transitionDuration = 0;

        var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis2.tooltip.disabled = true;
        // height of axis
        valueAxis2.height = am4core.percent(35);
        valueAxis2.zIndex = 3
        // this makes gap between panels
        valueAxis2.marginTop = 30;
        valueAxis2.renderer.baseGrid.disabled = true;
        valueAxis2.renderer.inside = true;
        valueAxis2.renderer.labels.template.verticalCenter = "bottom";
        valueAxis2.renderer.labels.template.padding(2, 2, 2, 2);
        //valueAxis.renderer.maxLabelPosition = 0.95;
        valueAxis2.renderer.fontSize = "0.8em"

        valueAxis2.renderer.gridContainer.background.fill = am4core.color("#000000");
        valueAxis2.renderer.gridContainer.background.fillOpacity = 0.05;

        var series2 = chart.series.push(new am4charts.ColumnSeries());
        series2.dataFields.dateX = "Date";
        series2.clustered = false;
        series2.dataFields.valueY = "Volume";
        series2.yAxis = valueAxis2;
        series2.tooltipText = "{valueY.value}";
        series2.name = "Series 2";
        // volume should be summed
        series2.groupFields.valueY = "sum";
        series2.defaultState.transitionDuration = 0;

        chart.cursor = new am4charts.XYCursor();

        var scrollbarX = new am4charts.XYChartScrollbar();

        var sbSeries = chart.series.push(new am4charts.LineSeries());
        sbSeries.dataFields.valueY = "Close";
        sbSeries.dataFields.dateX = "Date";
        scrollbarX.series.push(sbSeries);
        sbSeries.disabled = true;
        scrollbarX.marginBottom = 20;
        chart.scrollbarX = scrollbarX;
        scrollbarX.scrollbarChart.xAxes.getIndex(0).minHeight = undefined;
        /**
         * Set up external controls
         */

        // Date format to be used in input fields
        var inputFieldFormat = "yyyy-MM-dd";

        document.getElementById("b1m").addEventListener("click", function () {
            var max = dateAxis.groupMax["day1"];
            var date = new Date(max);
            am4core.time.add(date, "month", -1);
            zoomToDates(date);
        });

        document.getElementById("b3m").addEventListener("click", function () {
            var max = dateAxis.groupMax["day1"];
            var date = new Date(max);
            am4core.time.add(date, "month", -3);
            zoomToDates(date);
        });

        document.getElementById("b6m").addEventListener("click", function () {
            var max = dateAxis.groupMax["day1"];
            var date = new Date(max);
            am4core.time.add(date, "month", -6);
            zoomToDates(date);
        });

        document.getElementById("b1y").addEventListener("click", function () {
            var max = dateAxis.groupMax["day1"];
            var date = new Date(max);
            am4core.time.add(date, "year", -1);
            zoomToDates(date);
        });

        document.getElementById("bytd").addEventListener("click", function () {
            var max = dateAxis.groupMax["day1"];
            var date = new Date(max);
            am4core.time.round(date, "year", 1);
            zoomToDates(date);
        });

        document.getElementById("bmax").addEventListener("click", function () {
            var min = dateAxis.groupMin["day1"];
            var date = new Date(min);
            zoomToDates(date);
        });

        dateAxis.events.on("selectionextremeschanged", function () {
            updateFields();
        });

        dateAxis.events.on("extremeschanged", updateFields);

        function updateFields() {
            var minZoomed = dateAxis.minZoomed + am4core.time.getDuration(dateAxis.mainBaseInterval.timeUnit, dateAxis.mainBaseInterval.count) * 0.5;
            document.getElementById("fromfield").value = chart.dateFormatter.format(minZoomed, inputFieldFormat);
            document.getElementById("tofield").value = chart.dateFormatter.format(new Date(dateAxis.maxZoomed), inputFieldFormat);
        }

        document.getElementById("fromfield").addEventListener("keyup", updateZoom);
        document.getElementById("tofield").addEventListener("keyup", updateZoom);

        var zoomTimeout;
        function updateZoom() {
            if (zoomTimeout) {
                clearTimeout(zoomTimeout);
            }
            zoomTimeout = setTimeout(function () {
                var start = document.getElementById("fromfield").value;
                var end = document.getElementById("tofield").value;
                if ((start.length < inputFieldFormat.length) || (end.length < inputFieldFormat.length)) {
                    return;
                }
                var startDate = chart.dateFormatter.parse(start, inputFieldFormat);
                var endDate = chart.dateFormatter.parse(end, inputFieldFormat);

                if (startDate && endDate) {
                    dateAxis.zoomToDates(startDate, endDate);
                }
            }, 500);
        }

        function zoomToDates(date) {
            var min = dateAxis.groupMin["day1"];
            var max = dateAxis.groupMax["day1"];
            dateAxis.keepSelection = true;
            //dateAxis.start = (date.getTime() - min)/(max - min);
            //dateAxis.end = 1;

            dateAxis.zoom({ start: (date.getTime() - min) / (max - min), end: 1 });
        }


    }); // end am4core.ready()
}


