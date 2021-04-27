$(document).ready(function(){
    $.ajax({
        url: '/ajax_news_return/',
        type: "POST",
        dataType: "json",
        data: {},
        success: function (data) {
            news_data = data;
            for(i=0;i<data.news.items.length;i++){
                $('#news_board').append("<a class='news' href="+data.news.items[i]['link']+"><br></br>"+data.news.items[i]['title']);
            }
            var words = []
            for (i=0;i<data.words_list.length;i++){
                words.push({'text': data.words_list[i][0], 'weight': data.words_list[i][1]})
            }
            console.log(words)
            $('#wordcloud').jQCloud(words,{
                autoResize : true,
                height: 350
            });
            if (data.LSTM_sent> 50){
                var comment = "뉴스 분석 결과 "+data.LSTM_sent +"% 의 확률로 내일 코스피 종가가 오늘 대비 오를 것으로 예상됩니다." 
            }
            else if (data.LSTM_sent<= 50){
                var comment = "뉴스 분석 결과 "+(100-data.LSTM_sent) +"% 의 확률로 내일 코스피 종가가 오늘 대비 내릴 것으로 예상됩니다."
            }
            $("#model_result").append(comment);
            
        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
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
});