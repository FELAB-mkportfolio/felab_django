import json
from datetime import date
import cvxpy as cp
import math
import itertools as it
import operator
from datetime import datetime
from scipy import stats
from scipy.stats import norm
import pymysql
import pandas as pd
import numpy as np

class back_test:
    
    # 단순 일별수익률의 평균을 *365하여 연간수익률을 산출
    def Arithmetic_Mean_Annual(input,ret) :
        
        month_return =  np.mean(ret)
        return (month_return*365)

    # 기간중 투자했을때 하락할 수 있는 비율
    def dd(input,ret):
        cum_ret = (1 + ret).cumprod()
        max_drawdown = 0
        max_ret = 1
        dd_list = []
        c = 0
        for ix_ret in cum_ret.values:
            if max_ret < ix_ret:
                max_ret = ix_ret
            dd_list.append((ix_ret - max_ret) / max_ret) 
            c= c+1
        return dd_list
    
    # 기간중 투자했을때 최고로 많이 하락할 수 있는 비율
    def mdd(input,ret):
        
        cum_ret = (1 + ret).cumprod()
        max_drawdown = 0
        max_ret = 1
        for ix_ret in cum_ret.values:
            if max_drawdown > (ix_ret - max_ret) / max_ret:
                max_drawdown = (ix_ret - max_ret) / max_ret
            if max_ret < ix_ret:
                max_ret = ix_ret

        return abs(max_drawdown)

    # 포트폴리오 수익률에서 무위험 수익률을 제한 후 이를 포트폴리오의 표준편차로 나눠 산출한 값, 즉 위험대비 얼마나 수익이 좋은지의 척도
    def sharpe_ratio(input,ret, rf=0.008, num_of_date=365):
        
        return ((np.mean(ret - (rf / num_of_date))) / (np.std(ret))) * np.sqrt(num_of_date)
    
    # 설정한 confidence level에 따른(95%) 확률로 발생할 수 있는 손실액의 최대 액수
    def value_at_risk(input,ret, para_or_hist="para", confidence_level=0.95):
        
        vol = np.std(ret)
        if para_or_hist == "para":
            VaR = np.mean(ret) - vol * norm.ppf(confidence_level)
        else:
            print('error')

        return VaR
    
    # 전체 투자기간에서 상승한 ( ret > 0 ) 기간의 비율
    def winning_rate(input,ret):
        var_winning_rate = np.sum(ret > 0) / len(ret)
        return var_winning_rate    
    
    # 상승한날의 평균상승값을 하락한날의 평균하락값으로 나눈 비율
    def profit_loss_ratio(input,ret):

        if np.sum(ret > 0) == 0:
            var_profit_loss_ratio = 0
        elif np.sum(ret < 0) == 0:
            var_profit_loss_ratio = np.inf
        else:
            win_mean = np.mean(ret[ret > 0])
            loss_mean = np.mean(ret[ret < 0])
            var_profit_loss_ratio = win_mean / loss_mean
        return abs(var_profit_loss_ratio)

    # 데이터 취합하는 코드 
    #임시로 5가지 데이터 예시를 활용해 코드작성
    # 선택한 종목의 이름과 비중, 투자기간을 input 값으로 받음       
    
    def backtest_data(input,select,weight,start_data_1, end_data_1,start_amount):
        conn = pymysql.connect(host="localhost", user="root",password="su970728!", db="teststocks",charset="utf8")
        curs = conn.cursor()


        # input으로 받는 assetnames 입력
        a = select
        # 연습용 kp005380 kp086790
        stock_num = len(a)
        # input으로 받는 assetweights 입력
        
        b = list(map(float, weight))
        # 연습용 50 50

        # input으로 받는 from_period와 to_period 입력
        stock_return = pd.date_range(start=start_data_1, end=end_data_1)
        stock_return = pd.DataFrame(stock_return)
        stock_return.columns = ['Date']


        # 수익률로 이루어진 dataframe 만들기
        for stocklist in a:
            sql = "SELECT * FROM " + stocklist
            df = pd.read_sql(sql,conn)
            df = df[['Date','Change']]
            df.columns = ['Date',stocklist]
            stock_return = pd.merge(stock_return,df,how='left', left_on='Date',right_on='Date')
        stock_return = stock_return.dropna(axis=0)
        #print(stock_return)

        # 투자비중으로 이루어진 dataframe 만들기
        stock_weight = stock_return.Date
        stock_weight = pd.DataFrame(stock_weight)
        c = 0
        for stockweight in b:
            stock_weight[a[c]] = float(stockweight)
            c = c + 1
        #print(stock_weight)

        # 수익률 데이터와 투자비중을 곱한 하나의 데이터 생성 

        pfo_return = stock_return.Date
        pfo_return = pd.DataFrame(pfo_return)
        pfo_return['mean_return'] = 0
        for i in range(0,len(pfo_return)):
            return_result = list(stock_return.iloc[i,1:1+stock_num])
            return_weight = list(stock_weight.iloc[i,1:1+stock_num])
            pfo_return.iloc[i,1]  = np.dot(return_result,return_weight)
        pfo_return['acc_return'] = [x+1 for x in pfo_return['mean_return']]
        pfo_return['acc_return'] = list(it.accumulate(pfo_return['acc_return'], operator.mul))
        pfo_return['acc_return'] = [x-1 for x in pfo_return['acc_return']]
        pfo_return['final_balance'] = float(start_amount) + float(start_amount)*pfo_return['acc_return']
        pfo_return['Drawdown_list'] = back_test.dd(input,pfo_return['mean_return'])
        #print(pfo_return)

        backtest_return = {
            'pfo_return': [
                    {
                    'Date': list(pfo_return['Date']),
                    'mean_return': list(pfo_return['mean_return']),                 
                    'acc_return ratio': list(pfo_return['acc_return']),
                    'final_balance': list(pfo_return['final_balance']),
                    'Drawdown_list' : list(pfo_return['Drawdown_list'])
                     }
            ],         
            'indicator': [
                    {
                    'Mean': back_test.Arithmetic_Mean_Annual(input,pfo_return['mean_return']),
                    'Std': pfo_return['mean_return'].std() * np.sqrt(365),                 
                    'Sharpe ratio': back_test.sharpe_ratio(input,pfo_return['mean_return']),
                   'VaR': back_test.value_at_risk(input,pfo_return['mean_return']),
                    'MDD': back_test.mdd(input,pfo_return['mean_return']),
                    'Winning ratio': back_test.winning_rate(input,pfo_return['mean_return']),
                    'Gain/Loss Ratio': back_test.profit_loss_ratio(input,pfo_return['mean_return'])
                     }
            ]
        }  
        
        
        
        conn.close()    

        return backtest_return