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
import requests
from io import BytesIO
from sqlalchemy import create_engine 
import re
from eunjeon import Mecab

import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.model_selection import train_test_split
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from . import load
import collections

loaded_model = load.LoadConfig.model

#-*-coding:utf-8 -*-
# Create your views here.
#db 
db = {
        'host': "localhost",
        'user': "root",
        'password' : "root",
        'db_name' : "krmarket",
    }
    #홈페이지 메인
def home(request):
    return render(request, 'FElab_app/home.html',{})
#-------------------------------#

@csrf_exempt
def ajax_stockname_return(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db='stockcodename')
    sql = "SELECT * FROM codename;"
        
    #sql문 실행/ 데이터 받기
    curs = conn.cursor()
    curs.execute(sql)
    data = curs.fetchall()

    #db 접속 종료
    curs.close()
    conn.close()
    stock_arr = []
    for i in range(len(data)):
        stock_arr.append(data[i][1]+' '+data[i][2])

    return JsonResponse(stock_arr, safe=False)
#ajax 통신 (디비 내용 json으로 response)
@csrf_exempt
def ajax_db_return(request):
    
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    sql = "SELECT * FROM "+ request.POST['stock_code']+";"

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
    
#포트폴리오 최적화 한 것을 ajax로 통신
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
    interval = request.POST.get('interval')
    #strategy = request.POST.get('strategy')
    backtest = back_test()

    data = backtest.backtest_data(assetnames,assetweights,from_period,to_period,start_amount,rebalancing_month,conn,interval)

    return JsonResponse(data, safe=False)

#포트폴리오 최적화 페이지
def portfolio_optimize(request):
    return render(request, 'FElab_app/portfolio_optimize.html',{})
#--------------------------------#
def portfolio_optimize_result(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db=db['db_name'])
    mystocks= request.POST.getlist('mystocks[]')
    mystocks_weights = request.POST.getlist('mystocks_weights[]')
    from_period = pd.to_datetime(request.POST.get('my_from'))
    to_period = pd.to_datetime(request.POST.get('my_to'))
    w =[]
    for i in range(len(mystocks_weights)):
        w.append(float(mystocks_weights[i]))
    mystocks_weights = w
    strategy = request.POST.get('strategy')
    c_m = c_Models(mystocks,mystocks_weights,from_period,to_period,conn)
    ret_vol, efpoints, weights = c_m.plotting()
    data = {'ret_vol': ret_vol, 'efpoints': efpoints, "weights" : weights}
    return render(request, 'FElab_app/portfolio_optimize_result.html',context={'data':json.dumps(data)})
#포트폴리오 백테스트 페이지
def portfolio_backtest(request):
    return render(request, 'FElab_app/portfolio_backtest.html',{})
#--------------------------------#


#KRX에서 현시점에서 거래되고 있는 국내 주식 데이터 불러오기
def kospi_stocks():
    gen_req_url = 'http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd'
    
    down_data = {
    'mktId': 'STK',
    'share': '1',
    'csvxls_isNo': 'false',
    'name': 'fileDown',
    'url': 'dbms/MDC/STAT/standard/MDCSTAT01901'
    }
    
    headers = {
        'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36' #generate.cmd에서 찾아서 입력하세요
    }

    r = requests.get(gen_req_url, down_data, headers=headers)
    gen_req_url = 'http://data.krx.co.kr/comm/fileDn/download_excel/download.cmd'
    form_data = {
        'code': r.content
    }
    r = requests.post(gen_req_url, form_data, headers=headers)
    df = pd.read_excel(BytesIO(r.content),encoding = 'utf-8')
    #file_name = 'basic_'+ str(tdate)
    #df.to_excel(path+file_name, index=False, index_label=None)
    #print('KRX crawling completed :', tdate)
    kospi_df = df.iloc[:,1:3]
    kospi_df=kospi_df.rename(columns={"단축코드":"Code","한글 종목명":"Name"})
    kospi_df = kospi_df.set_index("Code")
    kospi_stocklist = {}
    for code in kospi_df.index:
        kospi_stocklist[code] = kospi_df.loc[code].Name.replace("보통주","")
    return kospi_stocklist

    
#업데이트되는 주식 코드, 종목명 테이블에 저장, db이름은 krcodename, table이름은 codename
def kospi_stocks_codenamesave(data):
    etfcodename = pd.DataFrame({'Code':['139260','139220','139290','139270','227550','227560','139250','139230','139240','227540','243880','243890','315270','139280'],
                             'Name':['TIGER 200 IT', 'TIGER 200 건설','TIGER 200 경기소비재','TIGER 200 금융','TIGER 200 산업재','TIGER 200 생활소비재'
                                     ,'TIGER 200 에너지화학','TIGER 200 중공업','TIGER 200 철강소재','TIGER 200 헬스케어'
                                    ,'TIGER 200 IT레버리지','TIGER 200 에너지화학레버리지','TIGER 200 커뮤니티케이션서비스','TIGER 200 경기방어']})
    tmp = pd.DataFrame(list(data.items()),columns=['Code', 'Name'])
    tmp = tmp.append(etfcodename)

    #engine = create_engine("mysql+mysqldb://root:1102@localhost:3306/krStockCodeName", encoding='utf-8')
    connection_string = f"{'root'}:{'1102'}@localhost:3306/{'krcodename'}?charset=utf8" 
    engine = create_engine(f'mysql://{connection_string}')
    conn = engine.connect()
    tmp.to_sql(name='codename', con=conn, if_exists='replace')


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
#뉴스 수집 후 반환 
@csrf_exempt
def ajax_news_return(request):
    keyword= str(request.POST.get('keyword'))
    c_id = "tYIGVa4i5v4xErQcG01z"
    c_pwd = "FZJ0DeaGzu"
    search_word = keyword #검색어
    encode_type = 'json' #출력 방식 json 또는 xml
    max_display = 100 #출력 뉴스 수
    sort = 'date' #결과값의 정렬기준 시간순 date, 관련도 순 sim
    start = 1 # 출력 위치
    url = f"https://openapi.naver.com/v1/search/news.{encode_type}?query={search_word}&display={str(int(max_display))}&start={str(int(start))}&sort={sort}"
    headers = {
        'X-Naver-Client-Id' : c_id,
        'X-Naver-Client-Secret' : c_pwd,
    }
    r = requests.get(url, headers=headers)
    news = r.json()
    data = {'news' : news}
    return JsonResponse(data, safe=False)
@csrf_exempt
def ajax_news_analysis(request):
    news_data = json.loads(request.POST.get('news_data', ''))
    mecab= Mecab()
    tokenizer = Tokenizer()
    def sentiment_predict(new_sentence):
        max_len = 30
        stopwords = ['의','가','이','은','들','는','좀','잘','걍','과','도','를','으로','자','에','와','한','하다']
        new_sentence = re.sub(r'[^ㄱ-ㅎㅏ-ㅣ가-힣 ]','', new_sentence)
        new_sentence = mecab.morphs(new_sentence) # 토큰화
        new_sentence = [word for word in new_sentence if not word in stopwords] # 불용어 제거
        encoded = tokenizer.texts_to_sequences([new_sentence]) # 정수 인코딩
        pad_new = pad_sequences(encoded, maxlen = max_len) # 패딩
        score = float(loaded_model.predict(pad_new)) # 예측
        return score * 100
    score= []
    words_list = []
    for i in range(len(news_data['items'])):
        title = news_data['items'][i]['title']
        words_list.extend(mecab.nouns(title))
        score.append(sentiment_predict(title))
    score_avg = sum(score)/len(news_data['items'])
    counter = collections.Counter(words_list)
    data = {'LSTM_sent' : score_avg, 'words_list' : counter.most_common(30)}
    return JsonResponse(data, safe=False)

@csrf_exempt
def ajax_macro_return(request):
    conn = pymysql.connect(host=db['host'], user=db['user'], password=db['password'], db='stockcodename')
    sql = "SELECT *,DATE_FORMAT(Date,'%Y') Year FROM macro_economics GROUP BY Year;"
    curs = conn.cursor()
    curs.execute(sql)
    data = curs.fetchall()
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
