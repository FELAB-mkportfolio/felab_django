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
            console.log(data.LSTM_sent);
            var words = []
            for (i=0;i<data.words_list.length;i++){
                words.push({'text': data.words_list[i][0], 'weight': data.words_list[i][1]})
            }
            console.log(words)
            //$('#word-cloud').jQCloud(words);
        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
    
    
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