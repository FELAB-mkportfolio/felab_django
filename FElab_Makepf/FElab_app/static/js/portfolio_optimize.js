var assetsBox = []
var stocknames = [];
$(document).ready(function () {
    
    $.ajax({
        url: '/ajax_db_return/',
        type: "POST",
        dataType: "json",
        success: function (data) {
            for (var i = 0; i < data.length; i++) {
                stocknames.push(data[i][0]);
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
    var cnt = 0;
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
    $('#optimize_btn').click(function () {
        if (assetsBox.length == 0) {
            alert("선택된 자산이 없습니다.");
        } else {
            opt_result();
        }
    });
});
function tobacktest() {
    if(assetsBox.length==0){
        alert("아무런 자산을 입력하지 않았습니다.");
    }else{
    asset_json = {};
    for (i = 0; i < assetsBox.length; i++) {
        asset_json[assetsBox[i]] = 0.2;
    }
    localStorage.setItem("assets_weight", JSON.stringify(asset_json));

    location.href = '/portfolio_backtest';
    }
}
function opt_result() {
    $('.optimize_result').css('display', 'block');
    var opt_chart = am4core.create('opt_report_chart', am4charts.PieChart);
    opt_chart.data = [{
        "country": "Lithuania",
        "litres": 501.9
    }, {
        "country": "Czech Republic",
        "litres": 301.9
    }, {
        "country": "Ireland",
        "litres": 201.1
    }, {
        "country": "Germany",
        "litres": 165.8
    }, {
        "country": "Australia",
        "litres": 139.9
    }, {
        "country": "Austria",
        "litres": 128.3
    }, {
        "country": "UK",
        "litres": 99
    }, {
        "country": "Belgium",
        "litres": 60
    }, {
        "country": "The Netherlands",
        "litres": 50
        }];
    var pieSeries = opt_chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "litres";
    pieSeries.dataFields.category = "country";
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

