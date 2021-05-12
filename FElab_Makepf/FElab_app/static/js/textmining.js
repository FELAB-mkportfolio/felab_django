var mystocks_names;
$(document).ready(function(){
    if(localStorage.getItem('mystocks_names')){
        mystocks_names = localStorage.getItem('mystocks_names');  
    }
    console.log(mystocks_names);
    $("#js-navbar-toggle").attr("src", "/static/images/menu_black.png");
    $('.nav-links').css("color","black");
    let today = new Date();  
    $('.now_date').text("기준일 " + today.getFullYear()+"/"+(Number(today.getMonth())+1)+"/"+today.getDate());
    
    $('#company_analysis').css('display','flex');
    $('.category').click(function(){
        $(".category").removeClass("clicked");
        $(this).addClass("clicked");
        if($(this).html()=="시장 분석"){
            $('#market_analysis').css('display','flex');
            $('#company_analysis').css('display','none');
            $('#macro_analysis').css('display','none');
        }
        else if($(this).html()=="기업 분석"){
            $('#market_analysis').css('display','none');
            $('#company_analysis').css('display','flex');
            $('#macro_analysis').css('display','none');
        }
        else{
            $('#market_analysis').css('display','none');
            $('#company_analysis').css('display','none');
            $('#macro_analysis').css('display','block');
        }
    });
    $('.horizon-prev').click(function(event) {
        event.preventDefault();
        $('#content').animate({
          scrollLeft: "-=775px"
        }, "slow");
    });
    $('.horizon-next').click(function(event) {
        console.log("hi");
        event.preventDefault();
        $('#content').animate({
            scrollLeft: "+=775px"
        }, "slow");
    });
    $('.recmd_btn').click(function(){
        $('#comboBox').val($(this).val());
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
                    $('.bt_right').animate({
                        width:"60%"},2000,
                        function(){$('#wordcloud').jQCloud(words,{
                            autoResize : false,
                            height: 350,
                            delay: 50,
                        });
                        if (data.LSTM_sent>50){
                            var comment = "수집된 뉴스의 감정점수는 "+ data.LSTM_sent.toFixed(0)+ " 점 입니다. 내일의 주가(코스피 종가)를 긍정적으로 예상하고 있습니다.";
                        }else if(data.LSTM_sent<=50){
                            var comment = "수집된 뉴스의 감정점수는 "+ data.LSTM_sent.toFixed(0)+ " 점 입니다. 내일의 주가(코스피 종가)를 부정적으로 예상하고 있습니다.";
                        }
                        $('#sent_score').html(comment);
                    });
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

            console.log(data);
            var macro = {}
            macro['Date'] = [];
            macro['Gold'] = [];
            macro['Silver'] = [];
            macro['oil'] = [];

            macro['exchange'] = [];
            macro['exchange_eur'] = [];
            macro['exchange_cny'] = [];
            macro['exchange_jpy'] = [];
            
            macro['KR10'] = [];
            macro['US10'] = [];

            macro['Kospi'] = [];
            macro['nasdaq'] = [];
            macro['SP500'] = [];

            macro['BTC'] = [];
            macro['ETH'] = [];
            
            for(var i=0;i<data.m_data.length;i++){
                macro['Date'].push(data.m_data[i][16]);
                macro['Gold'].push(data.m_data[i][2]);
                macro['Silver'].push(data.m_data[i][3]);
                macro['oil'].push(data.m_data[i][4]);

                macro['exchange'].push(data.m_data[i][5]);
                macro['exchange_eur'].push(data.m_data[i][6]);
                macro['exchange_cny'].push(data.m_data[i][7]);
                macro['exchange_jpy'].push(data.m_data[i][8]);

                macro['KR10'].push(data.m_data[i][9]);
                macro['US10'].push(data.m_data[i][10]);
                
                macro['Kospi'].push(data.m_data[i][11]);
                macro['nasdaq'].push(data.m_data[i][12]);
                macro['SP500'].push(data.m_data[i][13]);

                macro['BTC'].push(data.m_data[i][14]);
                macro['ETH'].push(data.m_data[i][15]);
                
            }
            Draw_macro1(macro);
            Draw_macro2(macro);
            Draw_macro3(macro);
            Draw_macro4(macro);
            Draw_macro5(macro);
            Draw_impchart(data.result);
            for(var i=0; i<data.d_data.length;i++){
                var append_text= ""
                r_array = round_array(data.d_data[i]);
                append_text+='<tr><td>'+data.d_data[i][1].substring(0,10)+'</td>';
                for(var j=2; j<r_array.length; j++){
                    append_text+='<td class="numberCell">'+r_array[j]+'</td>';
                }
                $('#asset_row').append(append_text+'</tr>');
            }
        },

        error: function (request, status, error) {
            console.log('실패');
        }
    });
});
function round_array(array){
    r_array = []
    for(var i=0;i<array.length;i++){
        r_array.push(Number(array[i]).toFixed(2));
    }
    return r_array
}
function option(title){
    return options ={
        title:{
            display: true,
            text : title,
        },
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
function Draw_impchart(importances){
    var impctx = document.getElementById('imp_chart').getContext('2d');
    var imp_chart = new Chart(impctx, {
        type: 'horizontalBar',
        data: {
            labels:['국제 금가격','국제 은가격','WTI(원유)','원달러 환율','원유로 환율','원위엔 환율','원엔 환율','국채10년물 금리','미국채 10년물 금리','나스닥','S&P500','BTC','ETH'],
            datasets:[{
                label : '',
                data: importances,
                backgroundColor: ['#003f5c','#2f4b7c','#665191','#a05195','#d45087','#f95d6a','#ff7c43','#ffa600','#2f4b7c','#665191','#a05195','#d45087','#f95d6a','#ff7c43','#ffa600'],
            }],
        },
        options: {
            legend: {
                display: false
            },
            responsive:true,
            maintainAspectRatio:false,
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: 0 // Edit the value according to what you need
                    }
                }],
                yAxes: [{
                    stacked: true
                }]
            }
        }
    });
}
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
                label: '국제 금가격',
                data: data['Gold'],
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: '국제 은가격',
                data: data['Silver'],
                borderColor: "#04092a",
                backgroundColor: '#04092a',
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'WTI(원유)',
                data: data['oil'],
                borderColor: "#639371",
                backgroundColor: '#639371',
                pointRadius: 1,
                pointHoverRadius: 1,
                lineTension: 0,
                fill: false,
            }]
        },
        options : option("원자재")
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
        options: option("금리")
    });
}
function Draw_macro3(data){
    var macro_ctx3 = document.getElementById("macro_graph3").getContext('2d');
    window.macro_chart3 = new Chart(macro_ctx3, {
        type: 'line',
        data: {
            labels: data['Date'],
            datasets: [
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
        options: option("인덱스")
    });
}
function Draw_macro4(data){
    var macro_ctx4 = document.getElementById("macro_graph4").getContext('2d');
    window.macro_chart4 = new Chart(macro_ctx4, {
        type: 'line',
        data: {
            labels: data['Date'],
            datasets: [{
                label: 'USD/KRW',
                data: data['exchange'],
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'EUR/KRW(유로화)',
                data: data['exchange_eur'],
                borderColor: "#04092a",
                backgroundColor: "#04092a",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'CNY/KRW(위엔화)',
                data: data['exchange_cny'],
                borderColor: "#cccccc",
                backgroundColor: "#cccccc",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'JPY/KRW(엔화)',
                data: data['exchange_jpy'],
                borderColor: "#639371",
                backgroundColor: "#639371",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            }],
        },
        options : option("환율")
    });
}
function Draw_macro5(data){
    var macro_ctx5 = document.getElementById("macro_graph5").getContext('2d');
    window.macro_chart5 = new Chart(macro_ctx5, {
        type: 'line',
        data: {
            labels: data['Date'],
            datasets: [{
                label: 'BTC',
                data: data['BTC'],
                borderColor: "#FFA500",
                backgroundColor: "#FFA500",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            },
            {
                label: 'ETH',
                data: data['ETH'],
                borderColor: "#04092a",
                backgroundColor: "#04092a",
                lineTension: 0,
                pointRadius: 1,
                pointHoverRadius: 1,
                fill: false,
            }],
        },
        options : option("가상화폐")
    });
}