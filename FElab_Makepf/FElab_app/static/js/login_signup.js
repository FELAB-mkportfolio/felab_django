$(document).ready(function () {
    $("input").keyup(function() {
        var pwd = $("#password").val();
        var pwd_check = $('#password_check').val();
        if(pwd != "" || pwd_check != ""){
            if(pwd == pwd_check){
                $('#submit').removeAttr('disabled');
            }
            else{
                $('#submit').attr("disabled", "disabled");
            }
        }
    });
    $('#invest_checkbox').change(function(){
        if($('#invest_checkbox').is(":checked")){

        }
    });
});