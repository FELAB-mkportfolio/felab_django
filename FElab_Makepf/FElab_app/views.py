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
        'password' : "su970728!",
        'db_name' : "krmarket",
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
    w =[]
    for i in range(len(mystocks_weights)):
        w.append(float(mystocks_weights[i]))
    mystocks_weights = w
    strategy = request.POST.get('strategy')
    c_m = c_Models(mystocks,mystocks_weights,from_period,to_period,conn)
    ret_vol, efpoints, weights = c_m.plotting()
    data = {'ret_vol': ret_vol, 'efpoints': efpoints, "weights" : weights}
    return JsonResponse(data, safe=False)

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


#업데이트되는 주식 코드, 종목명 테이블에 저장, db이름은 krcodename, table이름은 codename
def kospi_stocks_codenamesave(data):
    tmp = pd.DataFrame(list(data.items()),columns=['Code', 'Name'])
    #engine = create_engine("mysql+mysqldb://root:1102@localhost:3306/krStockCodeName", encoding='utf-8')
    connection_string = f"{'root'}:{'1102'}@localhost:3306/{'krcodename'}?charset=utf8" 
    engine = create_engine(f'mysql://{connection_string}')
    conn = engine.connect()
    tmp.to_sql(name='codename', con=conn, if_exists='append')


#DB 갱신
def datarefresh(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    sql = "SHOW tables;"
    curs = conn.cursor()
    curs.execute(sql)
    datas = curs.fetchall()

    #db에 있는 kospi 주식 데이터 갱신
    db_stocklist = [] #새롭게 상장된 주식을 확인하기 위해 현재 db에 있는 종목코드를 담는 공간
    for data in datas:
        db_stocklist.append(data[0][2:])
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
            print(ticker)
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
            #continue
            break
     

    #새롭게 상장된 주식이 있는지 체크, ETF는 TIGER만 이용하므로 체크하지 않음
    #ETF 티커 ['37550k', '02826k', '36328k', '33637l', '00806k', '26490k', '28513k', '33626k', '33626l', '00680k', '35320k', '00088k', '18064k', '00104k', '00279k', '00781k', '03473k', '00499k']
    
    etflist = ['139260','139220','139290','139270','227550','227560','139250','139230','139240','227540','243880','243890','315270','139280']
    current_stocks=list(kospi_stocks().keys())
    current_stocks.sort()
    
    #currentstock 티커 맨 마지막 k가 대문자임을 확인
    current_stocks = [i.lower() for i in current_stocks]
    
    db_stocklist.sort()
    newstocks = list(set(db_stocklist)-set(current_stocks)-set(etflist)) 
    print(newstocks)
    if len(newstocks)==0:
        #db 접속 종료
        kospi_stocks_codenamesave(kospi_stocks())
        print("db업데이트완료!")
        curs.close()
        conn.close()
        return 

    else:
        print("새로 상장된 주식 존재! DB 업데이트")
        engine = create_engine("mysql+mysqldb://root:1102@localhost:3306/krmarket", encoding='utf-8')
        conn = engine.connect()
        for stock in newstocks:
            tmp = fdr.DataReader(stock)
            tmp.to_sql(name='kp{}'.format(stock), con=conn, if_exists='append')
        print("db업데이트완료!")
        kospi_stocks_codenamesave(kospi_stocks())
        curs.close()
        conn.close()
        return  

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



#-------------------------------etf저장코드,실행하지 말 것 백업용----------------------#
def ETFdatasave():
    etfinfo = pd.read_csv("ETFdata.csv", encoding = 'cp949')

    etfinfo = etfinfo[etfinfo["수익률(최근 1년)"]>0]

    whatIfind = []
    for x in enumerate(etfinfo["기초지수"]):
        if "코스피" in x[1]:
            whatIfind.append(x[0])

    etfinfo = etfinfo.iloc[whatIfind,:]

    etfinfo = etfinfo[['종목코드','종목명','상장일','기초지수']]

    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    engine = create_engine("mysql+mysqldb://root:1102@localhost:3306/krmarket", encoding='utf-8')
    conn = engine.connect()
    for idx in etfinfo.index:
        tmp = etfinfo.loc[idx]
        tmp_df = fdr.DataReader(str(tmp["종목코드"]))
        #display(tmp_df)
        tmp_df.to_sql(name='kp{}'.format(tmp["종목코드"]), con=conn, if_exists='append')
        
    return etfinfo 

def etfcodenamesave(etfinfo):
    etfcodename = etfinfo[['종목코드','종목명']]
    etfcodename.columns = ['Code','Name']
    tmp = etfinfo
    #engine = create_engine("mysql+mysqldb://root:1102@localhost:3306/krStockCodeName", encoding='utf-8')
    connection_string = f"{'root'}:{'1102'}@localhost:3306/{'krcodename'}?charset=utf8" 
    engine = create_engine(f'mysql://{connection_string}')
    conn = engine.connect()
    tmp.to_sql(name='CodeName', con=conn, if_exists='append')