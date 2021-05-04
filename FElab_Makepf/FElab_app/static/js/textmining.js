$(document).ready(function(){
    $("#js-navbar-toggle").attr("src", "/static/images/menu_black.png");
    $('.nav-links').css("color","black");
    let today = new Date();  
    $('#now_date').text("기준일 " + today.getFullYear()+"/"+(Number(today.getMonth())+1)+"/"+today.getDate());
    $('.category').click(function(){
        $(".category").removeClass("clicked");
        $(this).addClass("clicked");
        if($(this).html()=="주가 분석"){
            //주가 분석
        }
        else{
            //기업분석
        }
    });
    var news_data
    $('#search_btn').click(function(){
        var keyword = $('#comboBox').val();
        if($('#comboBox').val()==""){
            alert("키워드를 입력해주세요");
        }
        else{
            $('#news_board').empty();
            $.ajax({
                url: '/ajax_news_return/',
                type: "POST",
                dataType: "json",
                data: {'keyword': keyword},
                success: function (data) {
                    news_data = data.news;
                    for(i=0;i<data.news.items.length;i++){
                        $('#news_board').append("<a class='news' href="+data.news.items[i]['link']+"><br></br>"+data.news.items[i]['title']);
                    }
                },
                error: function (request, status, error) {
                    console.log('실패');
                }
            });
        }
    });
    $('#analysis_btn').click(function(){
        if (typeof(news_data) == "undefined" || $('#comboBox').val()==""){
            alert("수집된 뉴스가 없습니다");
        }
        else{
            $.ajax({
                url: '/ajax_news_analysis/',
                type: "POST",
                dataType: "json",
                data: {'news_data': JSON.stringify(news_data)},
                success: function(data){
                    $('#wordcloud').empty();
                    var words = []
                    for (i=0;i<data.words_list.length;i++){
                        words.push({'text': data.words_list[i][0], 'weight': data.words_list[i][1]})
                    }
                    //$('.bt_right_block').css('width','60%');
                    $('.bt_right').animate({width:"60%"},2000,function(){$('#wordcloud').jQCloud(words,{
                        autoResize : false,
                        height: 350,
                        delay: 50,
                    });});
                    $('.bt_right').css("display","block");

                    Draw_sentchart(data.LSTM_sent);

                    
                },
                error: function (request, status, error) {
                    console.log('실패');
                }
            });
        }
    });
    $.ajax({
        url: '/ajax_macro_return/',
        type: "POST",
        dataType: "json",
        data: {},
        success: function (data) {
            var macro = {}
            macro['Date'] = [];
            macro['Gold'] = [];
            macro['Silver'] = [];
            macro['Guri'] = [];
            macro['oil'] = [];

            macro['exchange'] = [];
            macro['KR10'] = [];
            macro['US10'] = [];

            macro['Kospi'] = [];
            macro['SP500'] = [];
            macro['nasdaq'] = [];
            
            for(var i=0;i<data.length;i++){
                macro['Date'].push(data[i][12]);
                macro['Gold'].push(data[i][2]);
                macro['Silver'].push(data[i][3]);
                macro['Guri'].push(data[i][4]);
                macro['oil'].push(data[i][5]);
                macro['exchange'].push(data[i][6]);
                macro['KR10'].push(data[i][7]);
                macro['US10'].push(data[i][8]);
                
                macro['Kospi'].push(data[i][9]);
                macro['nasdaq'].push(data[i][10]);
                macro['SP500'].push(data[i][11]);
            }
            Draw_macro1(macro);
            Draw_macro2(macro);
            Draw_macro3(macro);
        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
});
function option(){
    return options ={
        responsive: true,
        maintainAspectRatio: false,
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
                    display: false,
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
                    labelString: '시세변동'
                }
            }]
        }
    }
};
function Draw_sentchart(sent){
    var sentctx= document.getElementById('sent_chart').getContext('2d');

    var purple_orange_gradient = sentctx.createLinearGradient(0, 0, 0, 600);
    purple_orange_gradient.addColorStop(0, 'orange');
    purple_orange_gradient.addColorStop(1, 'purple');
    
    var sent_chart = new Chart(sentctx, {
        type: 'bar',
        data: {
            labels: ["감성점수"],
            datasets: [{
                label: '',
                data: [sent],
                            backgroundColor: purple_orange_gradient,
                            hoverBackgroundColor: purple_orange_gradient,
                            hoverBorderWidth: 2,
                            hoverBorderColor: 'purple'
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio:false,
            scales: {
                yAxes: [{
                    gridLines: {
                        drawBorder: false,
                      },
                    ticks: {
                        min:0,
                        max:100,
                        beginAtZero:true
                    }
                }]
            }
        }
    });
    
    
}

function Draw_macro1(data){
    var macro_ctx1 = document.getElementById("macro_graph1").getContext('2d');
    window.macro_chart1 = new Chart(macro_ctx1, {
        type: 'line',
        data: {
            labels: data['Date'],
            datasets: [{
                label: '금 선물',
                data: data['Gold'],
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '은 선물',
                data: data['Silver'],
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '구리 선물',
                data: data['Guri'],
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            },
            {
                label: 'WTI(원유) 선물',
                data: data['oil'],
                borderColor: "#639371",
                backgroundColor: '#639371',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            }]
        },
        options : option()
    });

}
function Draw_macro2(data){
    var macro_ctx2 = document.getElementById("macro_graph2").getContext('2d');
    window.macro_chart2 = new Chart(macro_ctx2, {
        type: 'line',
        data: {
            labels: data['Date'],
            datasets: [{
                label: '미국고채 10년물 금리',
                data: data['US10'],
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '국고채 10년물 금리',
                data: data['KR10'],
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            }]
        },
        options: option()
    });
}
function Draw_macro3(data){
    var macro_ctx3 = document.getElementById("macro_graph3").getContext('2d');
    window.macro_chart3 = new Chart(macro_ctx3, {
        type: 'line',
        data: {
            labels: data['Date'],
            datasets: [{
                label: '환율',
                data: data['exchange'],
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                
                label: '코스피',
                data: data['Kospi'],
                borderColor: "#04092a",
                backgroundColor: "#04092a",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'NASDAQ',
                data: data['nasdaq'],
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'S&P500',
                data: data['SP500'],
                borderColor: "#639371",
                backgroundColor: '#639371',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            }],
        },
        options: option()
    });

}