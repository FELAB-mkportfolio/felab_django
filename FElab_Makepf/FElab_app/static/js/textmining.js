$(document).ready(function(){
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
        if(keyword == ""){
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
        if (news_data == ""){
            alert("수집된 뉴스가 없습니다");
        }
        else{
            $.ajax({
                url: '/ajax_news_analysis/',
                type: "POST",
                dataType: "json",
                data: {'news_data': JSON.stringify(news_data)},
                success: function(data){
                    console.log(data);
                    var words = []
                    for (i=0;i<data.words_list.length;i++){
                        words.push({'text': data.words_list[i][0], 'weight': data.words_list[i][1]})
                    }
                    $('#wordcloud').jQCloud(words,{
                        autoResize : true,
                        height: 350,
                        delay: 50,
                    });
                    if (data.LSTM_sent> 50){
                        var comment = "뉴스 분석 결과 "+data.LSTM_sent +"% 의 확률로 내일 코스피 종가가 오늘 대비 오를 것으로 예상됩니다." 
                    }
                    else if (data.LSTM_sent<= 50){
                        var comment = "뉴스 분석 결과 "+"<span style='color:#06c'>"+(100-data.LSTM_sent).toFixed(2) +"%</span> 의 확률로 내일 코스피 종가가 오늘 대비 내릴 것으로 예상됩니다."
                    }
                    //$("#model_result").append(comment);
                    $('.bt_right').animate({width:"60%"},2000);
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
                label: '코스피',
                data: data['Kospi'],
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'NASDAQ',
                data: data['nasdaq'],
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'S&P500',
                data: data['SP500'],
                borderColor: "#cccccc",
                backgroundColor: '#cccccc',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            }],
        },
        options: option()
    });

}