from django.shortcuts import render
from django.http import HttpResponse,JsonResponse
import json
import pymysql
from django.views.decorators.csrf import csrf_exempt
from plotly.offline import plot
from plotly.graph_objs import Scatter
from FElab_app.opt_models import c_Models
import pandas as pd
#-*-coding:utf-8 -*-
# Create your views here.
#db 
db = {
        'host': "localhost",
        'user': "root",
        'password' : "su970728!",
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
    assets= request.POST.getlist('assetsBox[]')
    from_period = pd.to_datetime(request.POST.get('from'))
    to_period = pd.to_datetime(request.POST.get('to'))
    strategy = request.POST.get('strategy')
    c_m = c_Models(assets,from_period,to_period,strategy,conn)
    ret_vol,tret_tvol = c_m.plotting()

    return JsonResponse(ret_vol, safe=False)
#ajax 백테스트
@csrf_exempt
def ajax_backtest(request):
    assetnames= request.POST.getlist('assetsBox[]')
    assetweights = request.POST.getlist('assetweights[]')
    from_period = request.POST.get('from')
    to_period = request.POST.get('to')
    rebalancing_month = request.POST.get('rebalancing_month')
    start_amount = request.POST.get('start_amount')
    strategy = request.POST.get('strategy')

    return JsonResponse(strategy, safe=False)
#포트폴리오 최적화 페이지
def portfolio_optimize(request):
    return render(request, 'FElab_app/portfolio_optimize.html',{})
#--------------------------------#

#포트폴리오 백테스트 페이지
def portfolio_backtest(request):
    x_data = [0,1,2,3]
    y_data = [x**2 for x in x_data]
    
    plot_div = plot([Scatter(x=x_data, y=y_data,
                        mode='lines', name='test',
                        opacity=0.8, marker_color='green')],
               output_type='div', include_plotlyjs=False, show_link=False, link_text='')
    return render(request, 'FElab_app/portfolio_backtest.html',context={'plot_div': plot_div})
#--------------------------------#

#텍스트 마이닝 페이지
def textmining(request):
    return render(request, 'FElab_app/textmining.html',{})
#--------------------------------#