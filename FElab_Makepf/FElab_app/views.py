from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
import json
import pymysql
from django.views.decorators.csrf import csrf_exempt
from FElab_app.opt_models import c_Models
import pandas as pd
from django.http import HttpResponse,JsonResponse
from FElab_app.back_test import back_test
import numpy as np
import FinanceDataReader as fdr
from datetime import datetime, timedelta
import time


#-*-coding:utf-8 -*-
# Create your views here.
#db 
db = {
        'host': "localhost",
        'user': "root",
        'password' : "root",
        'db_name' : "teststocks",
    }
    #홈페이지 메인
def home(request):
    return render(request, 'FElab_app/home.html',{})
#-------------------------------#

#ajax 통신 (디비 내용 json으로 response)
@csrf_exempt
def ajax_db_return(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    #종목코드를 입력받으면 시세를 반환하고 아무것도 없으면 단순 종목 이름들만 반환한다.
    if 'stock_code' in request.POST:
        sql = "SELECT * FROM "+ request.POST['stock_code']+";"
    else:
        sql = "SHOW TABLES;"

    #sql문 실행/ 데이터 받기
    curs = conn.cursor()
    curs.execute(sql)
    data = curs.fetchall()

    #db 접속 종료
    curs.close()
    conn.close()

    return JsonResponse(data, safe=False)

#포트폴리오 최적화 한 것을 ajax로 통신
@csrf_exempt
def ajax_portfolio_optimize_return(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    mystocks= request.POST.getlist('mystocks[]')
    mystocks_weights = request.POST.getlist('mystocks_weights[]')
    from_period = pd.to_datetime(request.POST.get('from'))
    to_period = pd.to_datetime(request.POST.get('to'))
    #strategy = request.POST.get('strategy')
    c_m = c_Models(mystocks,from_period,to_period,conn)
    ret_vol, efpoints, weights = c_m.plotting()
    data = {'ret_vol': ret_vol, 'efpoints': efpoints, "weights" : weights}
    return JsonResponse(data)

#ajax 백테스트
@csrf_exempt
def ajax_backtest(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    assetnames= request.POST.getlist('assetsBox[]')
    assetweights = request.POST.getlist('assetweights[]')
    from_period = request.POST.get('from')
    to_period = request.POST.get('to')
    rebalancing_month = request.POST.get('rebalancing_month')
    start_amount = request.POST.get('start_amount')
    #strategy = request.POST.get('strategy')
    backtest = back_test()
    data = backtest.backtest_data(assetnames,assetweights,from_period,to_period,start_amount,rebalancing_month,conn)

    return JsonResponse(data, safe=False)

#포트폴리오 최적화 페이지
def portfolio_optimize(request):
    return render(request, 'FElab_app/portfolio_optimize.html',{})
#--------------------------------#

#포트폴리오 백테스트 페이지
def portfolio_backtest(request):
    return render(request, 'FElab_app/portfolio_backtest.html',{})
#--------------------------------#

#DB 갱신
def datarefresh(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    sql = "SHOW TABLES;"
    curs = conn.cursor()
    curs.execute(sql)
    datas = curs.fetchall()

    for data in datas:
        ticker = data[0]
        sql = "SELECT Date FROM " + ticker + " ORDER BY Date DESC LIMIT 1;"
        
        curs = conn.cursor()
        curs.execute(sql)
        
        db_lastdate = curs.fetchall()

        #db 저장된 마지막 날짜
        db_lastdate = db_lastdate[0][0]
        #print(db_lastdate)
        
        #datareader로 불러온 마지막 날짜
        newdata_date = fdr.DataReader(ticker[2:]).iloc[-1].name
        #print(newdata_date)
        
        if (newdata_date)!=(db_lastdate):
            #print("다름!")
            
            newdata = fdr.DataReader(ticker[2:]).loc[db_lastdate+timedelta(days=1):newdata_date+timedelta(days=1)]
            newdata.reset_index(level=0, inplace=True)
            
            #newdata['Date'] = newdata['Date'].astype(str)
            #print(newdata['Date'])
            sql = "INSERT INTO " + ticker + " VALUES (%s,%s,%s,%s,%s,%s,%s);"
            val = [tuple(x) for x in newdata.to_numpy()]
            #print(val)
            curs.executemany(sql,val)
            conn.commit()
        else:
            continue


    print("종료")    

    #db 접속 종료
    curs.close()
    conn.close()

    return JsonResponse(data, safe=False)

#텍스트 마이닝 페이지
def textmining(request):
    return render(request, 'FElab_app/textmining.html',{})
#--------------------------------#

#회원가입 페이지
def signup(request):
    if request.method == 'POST':
        signup_form = UserCreationForm(request.POST)
        if signup_form.is_valid():
            signup_form.save()
        return redirect('posts:list')
    else:
        signup_form = UserCreationForm()
    
    return render(request, 'FElab_app/signup.html', {'signup_form':signup_form})

#로그인 페이지
def login(reques):
    return render(reques, 'FElab_app/Login.html', {})