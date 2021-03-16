var assetsBox = []

$(document).ready(function () {
    var chartdiv = document.querySelector('#opt_report_chart');
    var charttype = am4charts.PieChart;
    var stocknames = [];
    $.ajax({
        url: '/ajax_db_return/',
        type: "POST",
        dataType: "json",
        success: function (data) {
            for (var i = 0; i < data.length; i++) {
                stocknames.push(data[i][0]);
            }
            if (localStorage.getItem('assets_weight')!=null){
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
                
                $('#weightBox').append("<div style='position:relative;margin: 10px 0;width:100%;height:30px;display:flex;justify-content:space-around;border-bottom:1px solid #eeeeee;'><p style='font-size:20px;'>"
                + assetsBox[i] + "</p> <input id='assetweight"+i+"' class='input_weight' type='text' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px' value="+jparse[assetsBox[i]]+"></div>")
                
                }
                var chart = createChart(chartdiv, charttype);
                DrawChart(chart, assetsBox);
            }else{
                $('#assetsBox').empty();
            }
        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
    $('#weightBox').append()
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
            $('#assetsBox').empty();
            $('#weightBox').empty();
            $('#comboBox').val("");
            for (i = 0; i < assetsBox.length; i++) {
                $('#assetsBox').append("<div style='position:relative;margin-bottom:5px;width:100%;height:30px;display:flex;justify-content:center;border-bottom:1px solid #eeeeee;'><p>"
                    + assetsBox[i] + "</p > <button id='putout_btn' name=" + assetsBox[i] +
                    " style='position:absolute;right:5px;;width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></div>");
                $('#weightBox').append("<div style='position:relative;margin: 10px 0;width:100%;height:30px;display:flex;justify-content:space-around;border-bottom:1px solid #eeeeee;'><p style='font-size:20px;'>"
                + assetsBox[i] + "</p> <input  type='text' id='assetweight"+i+"' class='input_weight' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px'/></div>");
            }
        } else {
            alert("종목 정보가 올바르지 않습니다");
        }
    });
    $(document).on('click', '#putout_btn', function () {
        $('#assetsBox').empty();
        $('#weightBox').empty();
        assetsBox.splice(assetsBox.indexOf($(this).attr('name')),1);
        for (i = 0; i < assetsBox.length; i++) {
            $('#assetsBox').append("<div style='position:relative;margin-bottom:5px;width:100%;height:30px;display:flex;justify-content:center;border-bottom:1px solid #eeeeee;'><p>"
                + assetsBox[i] + "</p > <button id='putout_btn' name=" + assetsBox[i] +
                " style='position:absolute;right:5px;;width:60px;height:30px;border:none;border-radius:5px; background-color:#eeeeee;bottom:3px;'>빼기</button></div>");
            $('#weightBox').append("<div style='position:relative;margin: 10px 0;width:100%;height:30px;display:flex;justify-content:space-around;border-bottom:1px solid #eeeeee;'><p style='font-size:20px;'>"
            + assetsBox[i] + "</p> <input type='text' id='assetweight"+i+"'class='input_weight' style='width:100px;height:30px;border:none; background-color:#eeeeee;bottom:3px'/></div>");
        }
        stocknames.push($(this).attr('name'));
    });
    $(document).on('change', '.input_weight',function(){
        var chart = createChart(chartdiv, charttype);
        DrawChart(chart, assetsBox);
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
    if(JSON.parse(localStorage.getItem("assets_weight"))){
        jparse= JSON.parse(localStorage.getItem("assets_weight"));
        obj = Object.keys(jparse);
        for(i=0;i<assetsBox.length;i++){
            chart.data.push({ "Asset" : obj[i], "Weight" : jparse[obj[i]]});
        }
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "Weight";
        pieSeries.dataFields.category = "Asset";
    }else{
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
        
}