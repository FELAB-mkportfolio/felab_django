from django.shortcuts import render
import pymysql
#-*-coding:utf-8 -*-
# Create your views here.
#홈페이지 메인
def home(request):
    return render(request, 'FElab_app/home.html',{})
#-------------------------------#

#포트폴리오 최적화 페이지
def portfolio_optimize(request):
    #DB정보
    host= "localhost"
    user= "root"
    password = "su970728!"
    db = "teststocks"
    conn = pymysql.connect(host=host, user=user, password=password, db=db)
    sql = "SHOW TABLES;"

    #sql문 실행/ 데이터 받기
    curs = conn.cursor()
    curs.execute(sql)
    data = curs.fetchall()

    #db 접속 종료
    curs.close()
    conn.close()

    #프론트에 보낼 내용들
    context = {
        'dbdata' : data,
    }
    return render(request, 'FElab_app/portfolio_optimize.html',context)
#--------------------------------#

#포트폴리오 백테스트 페이지
def portfolio_backtest(request):
    return render(request, 'FElab_app/portfolio_backtest.html',{})
#--------------------------------#

#텍스트 마이닝 페이지
def textmining(request):
    return render(request, 'FElab_app/textmining.html',{})
#--------------------------------#