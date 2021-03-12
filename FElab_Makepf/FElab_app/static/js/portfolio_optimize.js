$(document).ready(function () {
    var stockdata;
    $.ajax({
        url: '/ajax_db_return/',
        type: "POST",
        dataType: "json",
        async:false,
        success: function (data) {
            stockdata = data;
        },
        error: function (request, status, error) {
            console.log('실패');
        }
    });
    $('#combobox').autocomplete({
        source : stockdata,
        select : function(event,ui){
            console.log(ui.item);
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
        close : function(event){
            console.log(event);
        }
    });
    localStorage.setItem('stockdata',stockdata);
});