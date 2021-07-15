'''
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
from sqlalchemy import create_engine 
import sys, traceback
import logging
import pandas_datareader as pdr
logging.basicConfig(level=logging.ERROR)

class autoUpdate:
    def startconnection(self):
        sql = "SHOW tables;"
        self.conn = pymysql.connect(host='localhost', user='root', password='su970728!', db='krmarket')
        self.engine= create_engine('mysql+pymysql://root:su970728!@localhost:3306/stockcodename') #pymysql로 작성시 error
        self.engine2 = create_engine('mysql+pymysql://root:su970728!@localhost:3306/krmarket')
        self.curs = self.conn.cursor()
        self.curs.execute(sql)
        self.datas = self.curs.fetchall()


    def kospi_stocks_codenamesave(self): #codename update
        etfcodename = pd.DataFrame({'Code':['139260','139220','139290','139270','227550','227560','139250','139230','139240','227540','243880','243890','315270','139280'],
                                         'Name':['TIGER 200 IT', 'TIGER 200 건설','TIGER 200 경기소비재','TIGER 200 금융','TIGER 200 산업재','TIGER 200 생활소비재'
                                                 ,'TIGER 200 에너지화학','TIGER 200 중공업','TIGER 200 철강소재','TIGER 200 헬스케어'
                                                ,'TIGER 200 IT레버리지','TIGER 200 에너지화학레버리지','TIGER 200 커뮤니티케이션서비스','TIGER 200 경기방어']})

        self.tmp = pd.DataFrame.from_dict(self.kospi_stocks(), orient='index').reset_index().rename(columns={'index': "Code", 0:'Name'})
        self.tmp = self.tmp.append(etfcodename)
        self.tmp = self.tmp.reset_index().drop('index',axis=1)
        try:
            self.tmp.to_sql(name='codename', con=self.engine.connect(), if_exists='replace')
        except:
            return logging.error(traceback.format_exc())
        print(datetime.now())
        print("codename update 성공")
        

    def kospi_stocks(self):  #KRX excel download
        try:
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
            df = pd.read_excel(BytesIO(r.content))
            #file_name = 'basic_'+ str(tdate)
            #df.to_excel(path+file_name, index=False, index_label=None)
            #print('KRX crawling completed :', tdate)
            kospi_df = df.iloc[:,1:3]
            kospi_df=kospi_df.rename(columns={"단축코드":"Code","한글 종목명":"Name"})
            kospi_df = kospi_df.set_index("Code")
            kospi_stocklist = {}
            for code in kospi_df.index:
                kospi_stocklist[code] = kospi_df.loc[code].Name.replace("보통주","")
        except:
            return logging.error(traceback.format_exc())
        return kospi_stocklist
    
    def DB_update(self): #Krmarket update
        #db에 있는 kospi 주식 데이터 갱신
        db_stocklist = [] #새롭게 상장된 주식을 확인하기 위해 현재 db에 있는 종목코드를 담는 공간
        process_cnt = 0
        #기존 디비 업데이트
        for data in self.datas:
            process_cnt+=1
            if process_cnt%10==0:
                print("현재 ", process_cnt ,"/",len(self.datas)," 업데이트 진행 중")
            if data[0][0]!="k": #db에 auth테이블들 존재하기 때문
                continue
            db_stocklist.append(data[0][2:].upper())
            ticker = data[0]
            sql = "SELECT Date FROM " + ticker + " ORDER BY Date DESC LIMIT 1;"
            self.curs.execute(sql)

            db_lastdate = self.curs.fetchall()
            #db 저장된 마지막 날짜
            db_lastdate = db_lastdate[0][0]

            #datareader로 불러온 마지막 날짜
            #상장폐지 try except
            try:
                newdata_date = fdr.DataReader(ticker[2:]).iloc[-1].name
            except:
                logging.error(traceback.format_exc())
                continue

            if (newdata_date)!=(db_lastdate):
                try:
                    newdata = fdr.DataReader(ticker[2:]).loc[db_lastdate+timedelta(days=1):newdata_date+timedelta(days=1)]
                    newdata.reset_index(level=0, inplace=True)
                    newdata['Date'] = newdata['Date'].astype(str)
                    sql = "INSERT INTO " + ticker + " VALUES (%s,%s,%s,%s,%s,%s,%s);"
                    val = [tuple(x) for x in newdata.to_numpy()]
                    self.curs.executemany(sql,val)
                    self.conn.commit()
                except:
                    logging.error(traceback.format_exc())
                    print("최신 기간 업데이트 중 ERROR", ticker)
                    continue
            else:
                continue
            
        #상장된 종목 추가  
        try:
            new_stocks= set(self.kospi_stocks().keys())-set(db_stocklist)
            for stock in new_stocks:
                tmp = fdr.DataReader(stock)
                try:
                    tmp.to_sql(name='kp%s' %stock, con=self.engine2.connect(), if_exists='append')
                except:
                    logging.error(traceback.format_exc())
                    print("상장 종목 추가 ERROR", ticker)
                    continue
        except:
            logging.error(traceback.format_exc())
        print("종목 DB 업데이트 성공")
    
    def DB_macro_update(self):
        try:
            gold = pdr.DataReader('GOLDAMGBD228NLBM', 'fred', start='2011-01-01')#gold
            gold.rename(columns={'GOLDAMGBD228NLBM': "Gold"},inplace=True)
            silver = pdr.DataReader('SLVPRUSD', 'fred', start='2011-01-01')#silver
            silver.rename(columns={'SLVPRUSD': "Silver"},inplace=True)

            oil = fdr.DataReader('CL','2011-01-01')[['Close']]
            oil.rename(columns ={'Close':'Oil'}, inplace=True)

            exchange = fdr.DataReader('USD/KRW', '2011-01-01')[['Close']]
            exchange.rename(columns={'Close':'exchange'},inplace=True)
            exchange_eur = fdr.DataReader('EUR/KRW', '2011-01-01')[['Close']]
            exchange_eur.rename(columns={'Close':'exchange_eur'},inplace=True)

            exchange_cny = fdr.DataReader('CNY/KRW', '2011-01-01')[['Close']]
            exchange_cny.rename(columns={'Close':'exchange_cny'},inplace=True)

            exchange_jpy = fdr.DataReader('JPY/KRW', '2011-01-01')[['Close']]
            exchange_jpy.rename(columns={'Close':'exchange_jpy'},inplace=True)

            KR10Bond = fdr.DataReader('KR10YT=RR', '2011-01-01')[['Close']]
            KR10Bond.rename(columns={'Close':'KR10'},inplace=True)
            US10Bond= fdr.DataReader('US10YT=X','2011-01-01')[['Close']]
            US10Bond.rename(columns={'Close':'US10'},inplace=True)

            kospi = fdr.DataReader('KS11','2011-01-01')[['Close']]
            kospi.rename(columns={'Close':'Kospi'},inplace=True)
            nasdaq = fdr.DataReader('NASDAQCOM', data_source='fred', start='2011-01-01')
            SP500= fdr.DataReader('US500','2011-01-01')[['Close']]
            SP500.rename(columns={'Close':'SP500'},inplace=True)

            BTC_kor = fdr.DataReader('BTC/KRW', '2016')[['Close']]
            BTC_kor.rename(columns={'Close':'BTC'},inplace=True)
            ETH_kor = fdr.DataReader('ETH/KRW', '2016')[['Close']]
            ETH_kor.rename(columns={'Close':'ETH'},inplace=True)

            macro_df = pd.concat([gold, silver, oil, exchange,exchange_eur, exchange_cny, exchange_jpy,KR10Bond,US10Bond, kospi,nasdaq,SP500,BTC_kor, ETH_kor], axis=1).fillna(method='ffill')[1:]
            macro_df.dropna(inplace=True)
            macro_df = macro_df.reset_index().rename(columns={"index":'Date'}).set_index("Date")
            macro_df.to_sql(name='macro_economics', con=self.engine.connect(), if_exists='replace')
            print("금융데이터 Update 성공")
        except:
            logging.error(traceback.format_exc())
            print("금융데이터 update 실패")
        
    def closeconnection(self):
        self.conn.close()
        self.curs.close()

 
#schedule.every(30).minutes.do(printhello) #30분마다 실행
#정해진 시간에 실행
dbupdate = autoUpdate()
n_time="17:33"

schedule.every(4).minutes.do(dbupdate.startconnection)
schedule.every(4).minutes.do(dbupdate.kospi_stocks_codenamesave)
schedule.every(4).minutes.do(dbupdate.DB_update)
schedule.every(4).minutes.do(dbupdate.DB_macro_update)
schedule.every(4).minutes.do(dbupdate.closeconnection)

#schedule.every().wednesday.at(n_time).do(dbupdate.startconnection)
#schedule.every().wednesday.at(n_time).do(dbupdate.kospi_stocks_codenamesave)
#schedule.every().wednesday.at(n_time).do(dbupdate.DB_update)
#schedule.every().wednesday.at(n_time).do(dbupdate.DB_macro_update)  
#schedule.every().wednesday.at(n_time).do(dbupdate.closeconnection)


#실제 실행하게 하는 코드
while True:
    schedule.run_pending()
    time.sleep(1)

''' 
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
from sqlalchemy import create_engine 
import sys, traceback
import logging
import pandas_datareader as pdr
logging.basicConfig(level=logging.ERROR)
## bok import 
from bs4 import BeautifulSoup
import datetime

class autoUpdate:
    def startconnection(self):
        sql = "SHOW tables;"
        self.conn = pymysql.connect(host='localhost', user='root', password='su970728!', db='krmarket')
        self.engine= create_engine('mysql+pymysql://root:su970728!@localhost:3306/stockcodename') #pymysql로 작성시 error
        self.engine2 = create_engine('mysql+pymysql://root:su970728!@localhost:3306/krmarket')
        self.engine3 = create_engine('mysql+pymysql://root:su970728!@localhost:3306/bokdata')
        self.curs = self.conn.cursor()
        self.curs.execute(sql)
        self.datas = self.curs.fetchall()


    def kospi_stocks_codenamesave(self): #codename update
        etfcodename = pd.DataFrame({'Code':['139260','139220','139290','139270','227550','227560','139250','139230','139240','227540','243880','243890','315270','139280'],
                                         'Name':['TIGER 200 IT', 'TIGER 200 건설','TIGER 200 경기소비재','TIGER 200 금융','TIGER 200 산업재','TIGER 200 생활소비재'
                                                 ,'TIGER 200 에너지화학','TIGER 200 중공업','TIGER 200 철강소재','TIGER 200 헬스케어'
                                                ,'TIGER 200 IT레버리지','TIGER 200 에너지화학레버리지','TIGER 200 커뮤니티케이션서비스','TIGER 200 경기방어']})

        self.tmp = pd.DataFrame.from_dict(self.kospi_stocks(), orient='index').reset_index().rename(columns={'index': "Code", 0:'Name'})
        self.tmp = self.tmp.append(etfcodename)
        self.tmp = self.tmp.reset_index().drop('index',axis=1)
        try:
            self.tmp.to_sql(name='codename', con=self.engine.connect(), if_exists='replace')
        except:
            return logging.error(traceback.format_exc())
        print(datetime.now())
        print("codename update 성공")
        

    def kospi_stocks(self):  #KRX excel download
        try:
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
            df = pd.read_excel(BytesIO(r.content))
            #file_name = 'basic_'+ str(tdate)
            #df.to_excel(path+file_name, index=False, index_label=None)
            #print('KRX crawling completed :', tdate)
            kospi_df = df.iloc[:,1:3]
            kospi_df=kospi_df.rename(columns={"단축코드":"Code","한글 종목명":"Name"})
            kospi_df = kospi_df.set_index("Code")
            kospi_stocklist = {}
            for code in kospi_df.index:
                kospi_stocklist[code] = kospi_df.loc[code].Name.replace("보통주","")
        except:
            return logging.error(traceback.format_exc())
        return kospi_stocklist
    
    def DB_update(self): #Krmarket update
        #db에 있는 kospi 주식 데이터 갱신
        db_stocklist = [] #새롭게 상장된 주식을 확인하기 위해 현재 db에 있는 종목코드를 담는 공간
        process_cnt = 0
        #기존 디비 업데이트
        for data in self.datas:
            process_cnt+=1
            if process_cnt%10==0:
                print("현재 ", process_cnt ,"/",len(self.datas)," 업데이트 진행 중")
            if data[0][0]!="k": #db에 auth테이블들 존재하기 때문
                continue
            db_stocklist.append(data[0][2:].upper())
            ticker = data[0]
            sql = "SELECT Date FROM " + ticker + " ORDER BY Date DESC LIMIT 1;"
            self.curs.execute(sql)

            db_lastdate = self.curs.fetchall()
            #db 저장된 마지막 날짜
            db_lastdate = db_lastdate[0][0]

            #datareader로 불러온 마지막 날짜
            #상장폐지 try except
            try:
                newdata_date = fdr.DataReader(ticker[2:]).iloc[-1].name
            except:
                logging.error(traceback.format_exc())
                continue

            if (newdata_date)!=(db_lastdate):
                try:
                    newdata = fdr.DataReader(ticker[2:]).loc[db_lastdate+timedelta(days=1):newdata_date+timedelta(days=1)]
                    newdata.reset_index(level=0, inplace=True)
                    newdata['Date'] = newdata['Date'].astype(str)
                    sql = "INSERT INTO " + ticker + " VALUES (%s,%s,%s,%s,%s,%s,%s);"
                    val = [tuple(x) for x in newdata.to_numpy()]
                    self.curs.executemany(sql,val)
                    self.conn.commit()
                except:
                    logging.error(traceback.format_exc())
                    print("최신 기간 업데이트 중 ERROR", ticker)
                    continue
            else:
                continue
            
        #상장된 종목 추가  
        try:
            new_stocks= set(self.kospi_stocks().keys())-set(db_stocklist)
            for stock in new_stocks:
                tmp = fdr.DataReader(stock)
                try:
                    tmp.to_sql(name='kp%s' %stock, con=self.engine2.connect(), if_exists='append')
                except:
                    logging.error(traceback.format_exc())
                    print("상장 종목 추가 ERROR", ticker)
                    continue
        except:
            logging.error(traceback.format_exc())
        print("종목 DB 업데이트 성공")
    
    def DB_macro_update(self):
        try:
            gold = pdr.DataReader('GOLDAMGBD228NLBM', 'fred', start='2011-01-01')#gold
            gold.rename(columns={'GOLDAMGBD228NLBM': "Gold"},inplace=True)
            silver = pdr.DataReader('SLVPRUSD', 'fred', start='2011-01-01')#silver
            silver.rename(columns={'SLVPRUSD': "Silver"},inplace=True)

            oil = fdr.DataReader('CL','2011-01-01')[['Close']]
            oil.rename(columns ={'Close':'Oil'}, inplace=True)

            exchange = fdr.DataReader('USD/KRW', '2011-01-01')[['Close']]
            exchange.rename(columns={'Close':'exchange'},inplace=True)
            exchange_eur = fdr.DataReader('EUR/KRW', '2011-01-01')[['Close']]
            exchange_eur.rename(columns={'Close':'exchange_eur'},inplace=True)

            exchange_cny = fdr.DataReader('CNY/KRW', '2011-01-01')[['Close']]
            exchange_cny.rename(columns={'Close':'exchange_cny'},inplace=True)

            exchange_jpy = fdr.DataReader('JPY/KRW', '2011-01-01')[['Close']]
            exchange_jpy.rename(columns={'Close':'exchange_jpy'},inplace=True)

            KR10Bond = fdr.DataReader('KR10YT=RR', '2011-01-01')[['Close']]
            KR10Bond.rename(columns={'Close':'KR10'},inplace=True)
            US10Bond= fdr.DataReader('US10YT=X','2011-01-01')[['Close']]
            US10Bond.rename(columns={'Close':'US10'},inplace=True)

            kospi = fdr.DataReader('KS11','2011-01-01')[['Close']]
            kospi.rename(columns={'Close':'Kospi'},inplace=True)
            nasdaq = fdr.DataReader('NASDAQCOM', data_source='fred', start='2011-01-01')
            SP500= fdr.DataReader('US500','2011-01-01')[['Close']]
            SP500.rename(columns={'Close':'SP500'},inplace=True)

            BTC_kor = fdr.DataReader('BTC/KRW', '2016')[['Close']]
            BTC_kor.rename(columns={'Close':'BTC'},inplace=True)
            ETH_kor = fdr.DataReader('ETH/KRW', '2016')[['Close']]
            ETH_kor.rename(columns={'Close':'ETH'},inplace=True)

            macro_df = pd.concat([gold, silver, oil, exchange,exchange_eur, exchange_cny, exchange_jpy,KR10Bond,US10Bond, kospi,nasdaq,SP500,BTC_kor, ETH_kor], axis=1).fillna(method='ffill')[1:]
            macro_df.dropna(inplace=True)
            macro_df = macro_df.reset_index().rename(columns={"index":'Date'}).set_index("Date")
            macro_df.to_sql(name='macro_economics', con=self.engine.connect(), if_exists='replace')
            print("금융데이터 Update 성공")
        except:
            logging.error(traceback.format_exc())
            print("금융데이터 update 실패")

    def EcosDownload(Statcode, Freq, Begdate, Enddate, Subcode1, Subcode2, Subcode3):
        
        url = 'http://ecos.bok.or.kr/api/StatisticSearch/ABVKLW5ENWDJQGXTQPRL/xml/kr/1/100000/%s/%s/%s/%s/%s/%s/%s/'%(Statcode, Freq, Begdate, Enddate, Subcode1, Subcode2, Subcode3)

        raw = requests.get(url)
        xml = BeautifulSoup(raw.text,'xml')


        # Pandas 데이터프레임으로 전환합니다.

        raw_data = xml.find_all("row")

        date_list = []
        value_list = []

        for item in raw_data:
            
                value = item.find('DATA_VALUE').text.encode('utf-8')
                date_str = item.find('TIME').text
                
                value = float(value)
                    
                date_list.append(datetime.datetime.strptime(date_str,'%Y%m'))
                value_list.append(value)
                
        df = pd.DataFrame(index = date_list)
        
        df['value'] = value_list
        
        return df

    def DB_bok_update(self):

        #self.conn = pymysql.connect(host='localhost', user='root', password='root', db='bokdata', charset='utf8')
        #self.engine3 = create_engine("mysql+pymysql://root:root@localhost:3306/bokdata", encoding='utf-8')
        #self.conn = self.engine3.connect()

        try: # bok api에서 전체 데이터셋 불러오고 업데이트
            BOK_MACRO = pd.concat([autoUpdate.EcosDownload('080Y119', 'MM', '201001', '203001', 'I51AG', '2',''), # 부동산업 불변지수
            autoUpdate.EcosDownload('901Y001', 'MM', '201001', '203001', 'AI1CF', '',''), # 국고채(3년)수익률
            autoUpdate.EcosDownload('901Y001', 'MM', '201001', '203001', 'AI1BB', '',''), # 소비자 물가등락률
            autoUpdate.EcosDownload('028Y015', 'MM', '201001', '203001', '1070000', '',''), # KOSPI
            autoUpdate.EcosDownload('901Y001', 'MM', '201001', '203001', 'AI1AK', '',''), # 실업률
            autoUpdate.EcosDownload('901Y001', 'MM', '201001', '203001', 'AI1AH', '3',''), # 제조업 가동률
            autoUpdate.EcosDownload('901Y001', 'MM', '201001', '203001', 'AI1BF', '3',''), # 주택매매가격등락률(전도시,KB)
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'F4100', 'AA',''), #  섹터별 업황실적 - 건설 
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'G4500', 'AA',''), #  섹터별 업황실적 - 도소매
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'Y9950', 'AA',''), #  섹터별 업황실적 - 서비스업
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'X5000', 'AA',''), #  섹터별 업황실적 - 대기업
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'X6000', 'AA',''), #  섹터별 업황실적 - 중소기업
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'X8000', 'AA',''), #  섹터별 업황실적 - 수출기업
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'X9000', 'AA',''), #  섹터별 업황실적 - 내수기업
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C1000', 'AA',''), #  섹터별 업황실적 - 식료품
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C2000', 'AA',''), #  섹터별 업황실적 - 화학물질/제품
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C2100', 'AA',''), #  섹터별 업황실적 - 의료물질/의약품
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C2600', 'AA',''), #  섹터별 업황실적 - 전자/영상/통신장비
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C2800', 'AA',''), #  섹터별 업황실적 - 전기장비
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C3000', 'AA',''), #  섹터별 업황실적 - 자동차
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C3100', 'AA',''), #  섹터별 업황실적 - 조선/기타운수
            autoUpdate.EcosDownload('041Y007', 'MM', '201001', '203001', 'C3200', 'AA','')] #  섹터별 업황실적 - 가구
                    ,axis=1)

            #BOK_MACRO = BOK_MACRO.reset_index().rename(columns={"index":'Date'}).set_index("Date")
            BOK_MACRO.columns = ['RealEstateIndices', 'ReturBonds', 'ConsumerPrice', 'KOSPI', 'Unemployment', 'ManufacturingOperatingRates', 
            'HousingPrice', 'Construction', 'Wholesale', 'Service', 'LargeBusinesses', 'SmallBusinesses', 'Export','Domestic','FoodProducts', 
            'Chemicals','Medicine','ElectronicCommunications','ElectricalEquipment','Automobiles','Shipbuilding','Furniture']
            BOK_MACRO.to_sql(name='bok_data', con=self.engine3.connect(), if_exists='replace')
            for i in BOK_MACRO:   
                if pd.isnull(BOK_MACRO[i]).all():
                    print('특정 지표가 모두 na이므로 해당 지표 확인 필요')
                    break
            print("bok Update 성공")
        except TypeError:
            print('positional arguments 개수 보다 많거나 적게 입력')
        except:
            logging.error(traceback.format_exc())
            print("bok update 실패")

        
    def closeconnection(self):
        self.conn.close()
        self.curs.close()

 
#schedule.every(30).minutes.do(printhello) #30분마다 실행
#정해진 시간에 실행
dbupdate = autoUpdate()
n_time="17:33"

schedule.every(4).minutes.do(dbupdate.startconnection)
schedule.every(4).minutes.do(dbupdate.kospi_stocks_codenamesave)
schedule.every(4).minutes.do(dbupdate.DB_update)
schedule.every(4).minutes.do(dbupdate.DB_macro_update)
schedule.every(4).minutes.do(dbupdate.DB_bok_update)
schedule.every(4).minutes.do(dbupdate.closeconnection)

'''schedule.every().wednesday.at(n_time).do(dbupdate.startconnection)
schedule.every().wednesday.at(n_time).do(dbupdate.kospi_stocks_codenamesave)
schedule.every().wednesday.at(n_time).do(dbupdate.DB_update)
schedule.every().wednesday.at(n_time).do(dbupdate.DB_macro_update)  
schedule.every().wednesday.at(n_time).do(dbupdate.closeconnection)'''


#실제 실행하게 하는 코드
while True:
    schedule.run_pending()
    time.sleep(1)






