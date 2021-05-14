import schedule
import time
#특정 함수 정의
import pymysql
from datetime import datetime, timedelta
import FinanceDataReader as fdr
import requests
import pandas as pd
from io import BytesIO
import numpy as np
from datetime import datetime
import time
conn = pymysql.connect('localhost', user='root', password='su970728!', db='krmarket')
sql = "SHOW tables;"
curs = conn.cursor()
curs.execute(sql)
datas = curs.fetchall()


def kospi_stocks_codenamesave(data):
    conn = pymysql.connect('localhost', user='root', password='su970728!', db='stockcodename')
    etfcodename = pd.DataFrame({'Code':['139260','139220','139290','139270','227550','227560','139250','139230','139240','227540','243880','243890','315270','139280'],
                             'Name':['TIGER 200 IT', 'TIGER 200 건설','TIGER 200 경기소비재','TIGER 200 금융','TIGER 200 산업재','TIGER 200 생활소비재'
                                     ,'TIGER 200 에너지화학','TIGER 200 중공업','TIGER 200 철강소재','TIGER 200 헬스케어'
                                    ,'TIGER 200 IT레버리지','TIGER 200 에너지화학레버리지','TIGER 200 커뮤니티케이션서비스','TIGER 200 경기방어']})
    tmp = pd.DataFrame(list(data.items()),columns=['Code', 'Name'])
    try:
        tmp = tmp.append(etfcodename)
        tmp.to_sql(name='codename', con=conn, if_exists='replace')
    except:
        error_code="codename Update 에러"
        pass

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

def DB_update():
    error_code=""
    #db에 있는 kospi 주식 데이터 갱신
    db_stocklist = [] #새롭게 상장된 주식을 확인하기 위해 현재 db에 있는 종목코드를 담는 공간

    #상장된거 체크 후 추가
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
        #상장폐지 try except
        try:
            newdata_date = fdr.DataReader(ticker[2:]).iloc[-1].name
        except:
            error_code="상장폐지"
            continue

        #print(newdata_date)

        if (newdata_date)!=(db_lastdate):
            try:
                newdata = fdr.DataReader(ticker[2:]).loc[db_lastdate+timedelta(days=1):newdata_date+timedelta(days=1)]
                newdata.reset_index(level=0, inplace=True)
                newdata['Date'] = newdata['Date'].astype(str)
                sql = "INSERT INTO " + ticker + " VALUES (%s,%s,%s,%s,%s,%s,%s);"
                val = [tuple(x) for x in newdata.to_numpy()]
                curs.executemany(sql,val)
                conn.commit()
            except:
                continue
        else:
            continue
    try:
        new_stocks= set(kospi_stocks().keys())-set(db_stocklist)
    except:
        error_code="KRX에러"
    for stock in new_stocks:
        tmp = fdr.DataReader(stock)
        try:
            tmp.to_sql(name='kp{}'.format(stock), con=conn, if_exists='append')
        except:
            error_code="DB업데이트 에러"
            continue
    
    try:
        kospi_stocks_codenamesave(kospi_stocks())
    except:
        error_code="KRX에러"
    
    if error_code=="":
        print("Update Done")
    else:
        print(error_code)
 
#schedule.every(30).minutes.do(printhello) #30분마다 실행
schedule.every().friday.at("22:32").do(DB_update) #월요일 00:10분에 실행
#schedule.every().day.at("10:30").do(job) #매일 10시30분에 
 
#실제 실행하게 하는 코드
while True:
    schedule.run_pending()
    print("Running")
    time.sleep(1)

